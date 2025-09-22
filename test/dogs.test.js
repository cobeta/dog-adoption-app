process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../app');
const User = require('../models/User');
const Dog  = require('../models/Dogs');
const { expect } = chai;

chai.use(chaiHttp);

describe('Auth + Dogs flow (2 users, cross-adopt, remove, and guards)', function () {
  this.timeout(20000);

  before(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    await Promise.all([User.deleteMany({}), Dog.deleteMany({})]);
  });

  after(async () => {
    await mongoose.disconnect();
  });

  // Helper: extract the cookie value from Set-Cookie header
  function getCookieFrom(res) {
    const setCookie = res.headers['set-cookie'];
    if (!setCookie || !setCookie.length) return null;
    const jwtCookie = setCookie.find(cookie => cookie.startsWith('jwt='));
    if (!jwtCookie) return null;
    return jwtCookie.split(';')[0]; 
  }

  async function signupAndLogin(email, password = 'test123') {
    // Try signup first
    let res = await chai.request(app)
      .post('/auth/signup')
      .set('Content-Type', 'application/json')
      .send({ email, password });

    // If signup didn’t set cookie, try login
    let cookie = getCookieFrom(res);
    if (!cookie) {
      res = await chai.request(app)
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send({ email, password });
      cookie = getCookieFrom(res);
    }
    expect(cookie, `auth cookie for ${email}`).to.be.a('string');
    return cookie;
  }

  let u1Cookie = null; // user1 registers A1, A2
  let u2Cookie = null; // user2 registers B1, B2
  let A1 = null, A2 = null, B1 = null, B2 = null;

  it('creates two users and logs them in', async () => {
    u1Cookie = await signupAndLogin('user1@example.com');
    u2Cookie = await signupAndLogin('user2@example.com');
  });

  it('U1 posts two dogs (A1, A2)', async () => {
    const dogA1 = { name: 'A1', description: 'U1 dog 1' };
    const dogA2 = { name: 'A2', description: 'U1 dog 2' };

    let res = await chai.request(app)
      .post('/dogs').set('Cookie', u1Cookie)
      .set('Content-Type', 'application/json')
      .send(dogA1);
    expect([200, 201]).to.include(res.status);
    expect(res.body).to.include.keys('_id', 'name', 'status', 'registered_by');
    expect(res.body.name).to.equal('A1');
    A1 = res.body;

    res = await chai.request(app)
      .post('/dogs').set('Cookie', u1Cookie)
      .set('Content-Type', 'application/json')
      .send(dogA2);
    expect([200, 201]).to.include(res.status);
    expect(res.body).to.include.keys('_id', 'name', 'status', 'registered_by');
    expect(res.body.name).to.equal('A2');
    A2 = res.body;
  });

  it('U2 posts two dogs (B1, B2)', async () => {
    const dogB1 = { name: 'B1', description: 'U2 dog 1' };
    const dogB2 = { name: 'B2', description: 'U2 dog 2' };

    let res = await chai.request(app)
      .post('/dogs').set('Cookie', u2Cookie)
      .set('Content-Type', 'application/json')
      .send(dogB1);
    expect([200, 201]).to.include(res.status);
    expect(res.body.name).to.equal('B1');
    B1 = res.body;

    res = await chai.request(app)
      .post('/dogs').set('Cookie', u2Cookie)
      .set('Content-Type', 'application/json')
      .send(dogB2);
    expect([200, 201]).to.include(res.status);
    expect(res.body.name).to.equal('B2');
    B2 = res.body;
  });

  it('U2 adopts A1 (owned by U1) → success', async () => {
    const res = await chai.request(app)
      .patch(`/dogs/${A1._id}/adopt`)
      .set('Cookie', u2Cookie)
      .set('Content-Type', 'application/json')
      .send({});
    expect([200, 204]).to.include(res.status);
    const body = res.body || {};
    if (res.type && res.type.includes('json')) {
      expect(body.status).to.equal('adopted');
      expect(body.adoption_date || body.adoptionDate).to.exist;
    }
  });

  it('U2 removes B2 (their own dog) → success', async () => {
    const res = await chai.request(app)
      .patch(`/dogs/${B2._id}/remove`)
      .set('Cookie', u2Cookie)
      .set('Content-Type', 'application/json')
      .send({});
    expect([200, 204]).to.include(res.status);
    if (res.type && res.type.includes('json')) {
      expect(res.body.status).to.equal('removed');
    }
  });

  it('U2 tries to adopt A1 again → should fail', async () => {
    const res = await chai.request(app)
      .patch(`/dogs/${A1._id}/adopt`)
      .set('Cookie', u2Cookie)
      .set('Content-Type', 'application/json')
      .send({});
    expect([400, 403, 409]).to.include(res.status);
  });

  it('U2 tries to remove A2 (not theirs) → should fail', async () => {
    const res = await chai.request(app)
      .patch(`/dogs/${A2._id}/remove`)
      .set('Cookie', u2Cookie)
      .set('Content-Type', 'application/json')
      .send({});
    expect([403, 404]).to.include(res.status);
  });

  it('U2 lists /users/me/dogs → sees two (B1 and B2)', async () => {
    const res = await chai.request(app)
      .get('/users/me/dogs?p=0')
      .set('Cookie', u2Cookie);
    expect(res).to.have.status(200);
    expect(res).to.be.json;

    expect(res.body).to.include.all.keys('page', 'perPage', 'total', 'totalPages', 'dogs');
    expect(res.body.dogs).to.be.an('array');

    const names = res.body.dogs.map(d => d.name);
    expect(names).to.include.members(['B1', 'B2']);
  });

  it('U2 lists /users/me/adoptedDogs → sees one (A1)', async () => {
    const res = await chai.request(app)
      .get('/users/me/adoptedDogs?p=0')
      .set('Cookie', u2Cookie);
    expect(res).to.have.status(200);
    expect(res).to.be.json;

    expect(res.body).to.include.all.keys('page', 'perPage', 'total', 'totalPages', 'dogs');
    expect(res.body.dogs).to.be.an('array');

    expect(res.body.total).to.equal(1);
    const names = res.body.dogs.map(d => d.name);
    expect(names).to.include('A1');
  });
});
