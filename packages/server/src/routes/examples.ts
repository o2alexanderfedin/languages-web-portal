import { Router } from 'express';
import { ExampleService } from '../services/exampleService.js';
import { ProjectService } from '../services/projectService.js';
import { config } from '../config/env.js';
import type { ExampleLoadResponse } from '@repo/shared';

const router = Router();

// Lazy initialization to support test environment variables
function getExampleService(): ExampleService {
  return new ExampleService();
}

function getProjectService(): ProjectService {
  const uploadDir = process.env.UPLOAD_DIR || config.uploadDir;
  return new ProjectService(uploadDir);
}

/**
 * GET /api/examples/:toolId
 * Returns list of available examples for a tool
 */
router.get('/examples/:toolId', async (req, res) => {
  const { toolId } = req.params;

  const exampleService = getExampleService();
  const examples = await exampleService.getToolExamples(toolId);

  res.json({ examples });
});

/**
 * POST /api/examples/:toolId/:exampleName
 * Creates a new project and loads an example into it
 */
router.post('/examples/:toolId/:exampleName', async (req, res) => {
  const { toolId, exampleName } = req.params;

  const projectService = getProjectService();
  const exampleService = getExampleService();

  // Create new project directory
  const { projectId, projectPath } = await projectService.createProjectDir();

  // Load example into project directory
  const fileCount = await exampleService.loadExample(
    toolId,
    exampleName,
    projectPath,
  );

  const response: ExampleLoadResponse = {
    projectId,
    message: `Example '${exampleName}' loaded successfully`,
    fileCount,
    toolId,
    exampleName,
  };

  res.status(201).json(response);
});

export default router;
