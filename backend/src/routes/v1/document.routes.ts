import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middlewares/auth.middleware';
import * as documentController from '../../controllers/document.controller';

const router = Router();

// Configure multer to hold the file in memory so we can pass the buffer to Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF files are allowed.'));
    }
  }
});

// Protect all document APIs with the authentication middleware
router.use(requireAuth);

// Routes
router.post('/', upload.single('file'), documentController.uploadDocument);
router.get('/', documentController.getDocuments);
// Notice that /compare needs to be defined BEFORE /:id to avoid :id capturing 'compare'
router.post('/compare', documentController.compareDocuments);

router.get('/:id', documentController.getDocumentById);
router.delete('/:id', documentController.deleteDocument);
router.post('/:id/ask', documentController.askQuestion);
router.post('/:id/analyze', documentController.analyzeDocument);
router.get('/:id/analysis', documentController.getDocumentAnalysis);
router.post('/:id/attention-areas', documentController.scanAttentionAreas);
router.post('/:id/checklist', documentController.generateChecklist);
router.post('/:id/legal-questions', documentController.generateLegalQuestions);

export default router;
