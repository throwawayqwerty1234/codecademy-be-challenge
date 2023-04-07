import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import {Request, Response} from 'express';
import * as swaggerUi from 'swagger-ui-express';
import * as swaggerJsdoc from 'swagger-jsdoc';

import * as swaggerOptions from '../swagger.json';

interface Cat {
  id?: string;
  message?: string;
}

interface RequestError {
  error: string;
}

if (process.env.NODE_ENV !== 'production') {
  swaggerOptions.swaggerDefinition.schemes = ['http'];
}

const swaggerSpec = swaggerJsdoc(swaggerOptions);
const app = express();

// Add Swagger middleware to app
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Use bodyParser middleware for parsing request body
app.use(bodyParser.json());

// mkdir uploads
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// Define storage for uploaded cat pics
const storage = multer.diskStorage({
  destination: function (req: any, file: any, cb: any) {
    cb(null, path.join(__dirname, './uploads'));
  },
  filename: function (req: any, file: any, cb: any) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({storage: storage});

// API endpoints
/**
 * Uploads a cat pic.
 * @swagger
 * /cats:
 *   post:
 *     summary: Uploads a cat pic.
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: catPic
 *         type: file
 *         required: true
 *         description: The cat picture to upload. Once uploaded, the cat pic can be downloaded at /api/cats/{id}.
 *     responses:
 *       200:
 *         description: The ID of the uploaded cat pic.
 *         schema:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             message:
 *               type: string
 *       400:
 *         description: No file uploaded.
 *         schema:
 *          type: object
 *          properties:
 *           error:
 *             type: string
 */
app.post(
  '/api/cats',
  upload.single('catPic'),
  (req: Request, res: Response<Cat | RequestError>) => {
    // Save the uploaded file to the server
    const file = req.file;
    if (!file) {
      console.error('No file uploaded');
      res.status(400).json({error: 'No file uploaded'});
      return;
    }
    console.log(`Received file ${file.filename}`);
    res.status(201).json({
      id: file.filename,
      message: 'Cat pic uploaded successfully',
    });
  }
);

/**
 * Deletes a cat pic.
 * @swagger
 * /cats/{id}:
 *   delete:
 *     summary: Deletes a cat pic.
 *     parameters:
 *       - in: path
 *         name: id
 *         type: string
 *         required: true
 *         description: The ID of the cat pic to delete.
 *     responses:
 *       200:
 *         description: A message indicating that the cat pic was deleted successfully.
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *       500:
 *         description: Error deleting file.
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 */
app.delete(
  '/api/cats/:id',
  (
    req: Request<{id: string}>,
    res: Response<{message: string} | RequestError>
  ) => {
    // Delete the specified file from the server
    const id = req.params.id;
    const filePath = path.join(__dirname, 'uploads', id);
    fs.unlink(filePath, err => {
      if (err) {
        console.error(`Error deleting file ${id}: ${err}`);
        res.status(500).json({error: 'Error deleting file'});
      } else {
        console.log(`Deleted file ${id}`);
        res.status(200).json({message: 'Cat pic deleted successfully'});
      }
    });
  }
);

/**
 * Updates a previously uploaded cat pic.
 * @swagger
 * /cats/{id}:
 *   put:
 *     summary: Updates a previously uploaded cat pic.
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         type: string
 *         required: true
 *         description: The ID of the cat pic to update.
 *       - in: formData
 *         name: catPic
 *         type: file
 *         required: true
 *         description: The updated cat picture.
 *     responses:
 *       200:
 *         description: A message indicating that the cat pic was updated successfully.
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *             id:
 *               type: string
 *       400:
 *         description: No file uploaded.
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *       500:
 *         description: Error updating file.
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 */
app.put(
  '/api/cats/:id',
  upload.single('catPic'),
  (req: Request<{id: string}>, res: Response<Cat | RequestError>) => {
    // Update the specified file with the uploaded file
    const id = req.params.id;
    const filePath = path.join(__dirname, 'uploads', id);

    if (!fs.existsSync(filePath)) {
      console.error(`File ${id} not found`);
      res.status(404).json({error: 'File not found'});
      return;
    }

    fs.unlink(filePath, err => {
      if (err) {
        console.error(`Error updating file ${id}: ${err}`);
        res.status(500).json({error: 'Error updating file'});
      } else {
        const file = req.file;
        if (!file) {
          console.error('No file uploaded');
          res.status(400).json({error: 'No file uploaded'});
          return;
        }
        console.log(`Updated file ${id} with ${file.filename}`);
        res.status(200).json({
          id: file.filename,
          message: 'Cat pic updated successfully',
        });
      }
    });
  }
);

/**
 * Fetches a particular cat image file by its ID.
 * @swagger
 * /cats/{id}:
 *   get:
 *     summary: Fetches a particular cat image file by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         type: string
 *         required: true
 *         description: The ID of the cat pic to fetch.
 *     responses:
 *       200:
 *         description: The cat pic file.
 *         schema:
 *           type: file
 *       404:
 *         description: The specified cat pic was not found.
 *         schema:
 *          type: object
 *          properties:
 *            error:
 *             type: string
 */
app.get('/api/cats/:id', (req: Request<{id: string}>, res: Response) => {
  // Return the specified file to the client
  const id = req.params.id;
  const filePath = path.join(__dirname, 'uploads', id);
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      console.error(`Error retrieving file ${id}: ${err}`);
      res.status(404).json({error: 'File not found'});
    } else {
      console.log(`Retrieved file ${id}`);
      res.status(200).download(filePath);
    }
  });
});

/**
 * Fetches a list of the uploaded cat pics.
 * @swagger
 * /cats:
 *   get:
 *     summary: Fetches a list of the uploaded cat pics.
 *     responses:
 *       200:
 *         description: A list of the uploaded cat pics.
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *       500:
 *         description: Internal Server Error.
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 */
app.get('/api/cats', (req: Request, res: Response<Cat[] | RequestError>) => {
  const filesPath = path.join(__dirname, 'uploads');
  fs.readdir(filesPath, (err, files) => {
    if (err) {
      console.error(`Error reading uploads directory: ${err}`);
      res.status(500).json({error: 'Error reading directory'});
    } else {
      const cats = files.map(file => ({
        id: file,
      }));
      console.log(`Retrieved list of ${cats.length} cat pics`);
      res.status(200).json(cats);
    }
  });
});

// Start the server
const port = 3000;
const server = app.listen(port, () => {
  console.log(
    `Server listening on port ${port}. View documention at http://localhost:${port}/api-docs`
  );
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = server;
