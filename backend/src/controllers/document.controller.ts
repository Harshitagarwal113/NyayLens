import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DocumentService } from '../services/document.service';

const idParamSchema = z.object({
  id: z.string().uuid('Invalid document ID format'),
});

export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const document = await DocumentService.uploadDocument(userId, req.file as Express.Multer.File);

    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const documents = await DocumentService.getDocuments(userId);

    res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocumentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    // Validate ID parameter
    const { id } = idParamSchema.parse(req.params);

    const document = await DocumentService.getDocumentById(id, userId);

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: error.issues[0].message } });
    }
    next(error);
  }
};

export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    // Validate ID parameter
    const { id } = idParamSchema.parse(req.params);

    await DocumentService.deleteDocument(id, userId);

    res.status(200).json({
      success: true,
      data: { message: 'Document deleted successfully' },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: error.issues[0].message } });
    }
    next(error);
  }
};

const askQuestionSchema = z.object({
  question: z.string().min(1, 'Question cannot be empty'),
});

export const askQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const { id } = idParamSchema.parse(req.params);
    const { question } = askQuestionSchema.parse(req.body);

    // Dynamic import to avoid circular dependencies if any, but since we are in controller, normal import is fine.
    // I will use require inline to avoid breaking existing imports at the top
    const { QnAService } = require('../services/qna.service');
    
    const result = await QnAService.askQuestion(userId, id, question);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: error.issues[0].message } });
    }
    next(error);
  }
};

export const analyzeDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const { id } = idParamSchema.parse(req.params);

    const { AnalysisService } = require('../services/analysis.service');
    const result = await AnalysisService.analyzeDocument(userId, id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: error.issues[0].message } });
    }
    next(error);
  }
};

export const getDocumentAnalysis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const { id } = idParamSchema.parse(req.params);

    const { AnalysisService } = require('../services/analysis.service');
    const result = await AnalysisService.getAnalysis(userId, id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: error.issues[0].message } });
    }
    next(error);
  }
};

export const scanAttentionAreas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const { id } = idParamSchema.parse(req.params);

    const { AttentionScannerService } = require('../services/attention.service');
    const result = await AttentionScannerService.scanAttentionAreas(userId, id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: error.issues[0].message } });
    }
    next(error);
  }
};

const compareDocsSchema = z.object({
  documentId1: z.string().uuid(),
  documentId2: z.string().uuid(),
});

export const compareDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const { documentId1, documentId2 } = compareDocsSchema.parse(req.body);

    const { FeaturesService } = require('../services/features.service');
    const result = await FeaturesService.compareDocuments(userId, documentId1, documentId2);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: error.issues[0].message } });
    }
    next(error);
  }
};

export const generateChecklist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const { id } = idParamSchema.parse(req.params);

    const { FeaturesService } = require('../services/features.service');
    const result = await FeaturesService.generateChecklist(userId, id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: error.issues[0].message } });
    }
    next(error);
  }
};

export const generateLegalQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const { id } = idParamSchema.parse(req.params);

    const { FeaturesService } = require('../services/features.service');
    const result = await FeaturesService.generateLegalQuestions(userId, id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: error.issues[0].message } });
    }
    next(error);
  }
};
