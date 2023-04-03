const request = require('supertest');
const app = require('.');

describe('Meow API', () => {
  afterAll(async () => {
    // delete the uploads directory
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, 'uploads');
    fs.rmSync(uploadsDir, {recursive: true});
  });

  describe('POST /api/cats', () => {
    test('should upload a cat pic', async () => {
      const res = await request(app)
        .post('/api/cats')
        .attach('catPic', './test/cat-100.jpeg');
      expect(res.status).toBe(201);
      expect(res.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          message: 'Cat pic uploaded successfully',
        })
      );
    });

    test('should not upload a cat pic if no file is provided', async () => {
      const res = await request(app).post('/api/cats');
      expect(res.status).toBe(400);
      expect(res.body).toEqual({error: 'No file uploaded'});
    });
  });

  describe('DELETE /api/cats/:id', () => {
    let id: string;
    beforeAll(async () => {
      const res = await request(app)
        .post('/api/cats')
        .attach('catPic', './test/cat-100.jpeg');
      id = res.body.id;
    });

    test('should delete a cat pic', async () => {
      const res = await request(app).delete(`/api/cats/${id}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: 'Cat pic deleted successfully',
      });
    });

    test('should return an error if the specified file does not exist', async () => {
      const res = await request(app).delete(`/api/cats/${id}`);
      expect(res.status).toBe(500);
      expect(res.body).toEqual({error: 'Error deleting file'});
    });
  });

  describe('PUT /api/cats/:id', () => {
    let id: string;
    beforeAll(async () => {
      const res = await request(app)
        .post('/api/cats')
        .attach('catPic', './test/cat-100.jpeg');
      id = res.body.id;
    });

    test('should update a cat pic', async () => {
      const res = await request(app)
        .put(`/api/cats/${id}`)
        .attach('catPic', './test/cat-304.jpeg');
      id = res.body.id;
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Cat pic updated successfully');
    });

    test('should return an error if no new picture is attached', async () => {
      const res = await request(app).put(`/api/cats/${id}`).attach('catPic');
      expect(res.status).toBe(400);
      expect(res.body).toEqual({error: 'No file uploaded'});
    });

    test('should not update a cat pic if original file is not found', async () => {
      const res = await request(app).put(`/api/cats/${id}`);
      expect(res.status).toBe(404);
      expect(res.body).toEqual({error: 'File not found'});
    });
  });

  describe('GET /api/cats/:id', () => {
    let id: string;
    beforeAll(async () => {
      const res = await request(app)
        .post('/api/cats')
        .attach('catPic', './test/cat-100.jpeg');
      id = res.body.id;
    });

    test('should return a cat pic', async () => {
      const res = await request(app).get(`/api/cats/${id}`);
      expect(res.status).toBe(200);
    });

    test('should return an error if the specified file does not exist', async () => {
      const res = await request(app).get(`/api/cats/${id}asdf`);
      expect(res.status).toBe(404);
      expect(res.body).toEqual({error: 'File not found'});
    });
  });

  describe('GET /api/cats', () => {
    test('should return all cat pics', async () => {
      const res = await request(app).get('/api/cats');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
          }),
        ])
      );
    });
  });
});
