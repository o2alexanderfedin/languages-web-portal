import { Router } from 'express';
import type { Request, Response } from 'express';
import { outputService } from '../services/outputService.js';
import { downloadService } from '../services/downloadService.js';
import { ProjectService } from '../services/projectService.js';
import { config } from '../config/env.js';
import { UserError } from '../types/errors.js';

const router = Router();

// Lazy projectService initialization (same pattern as execute.ts for test compatibility)
let projectService: ProjectService | null = null;
function getProjectService(): ProjectService {
  if (!projectService) {
    projectService = new ProjectService(process.env.UPLOAD_DIR || config.uploadDir);
  }
  return projectService;
}

/**
 * GET /api/projects/:projectId/output
 *
 * Returns file tree structure for a project's output directory
 *
 * Response: { data: FileTreeResponse }
 * Errors:
 * - 404: Project not found or no output available
 */
router.get('/projects/:projectId/output', async (req: Request, res: Response) => {
  const { projectId } = req.params;

  try {
    // Resolve project path (validates path safety)
    const projectPath = await getProjectService().getProjectPath(projectId);

    // Build file tree
    const fileTree = await outputService.buildFileTree(projectPath);

    res.json({ data: fileTree });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new UserError('Project not found or no output available', 404);
    }
    throw error;
  }
});

/**
 * GET /api/projects/:projectId/preview/:filePath(*)
 *
 * Returns file content with metadata (truncates large files, handles binary files)
 *
 * Note: /:filePath(*) captures paths with slashes (e.g., src/main.c)
 *
 * Response: { data: FilePreviewResponse }
 * Errors:
 * - 403: Path traversal detected
 * - 404: File not found
 */
router.get('/projects/:projectId/preview/:filePath(*)', async (req: Request, res: Response) => {
  const { projectId, filePath } = req.params;

  // Resolve project path (validates path safety)
  const projectPath = await getProjectService().getProjectPath(projectId);

  // Read file content (validates file path safety)
  // This will throw UserError with 403 for path traversal or 404 for not found
  const preview = await outputService.readFileContent(projectPath, filePath);

  res.json({ data: preview });
});

/**
 * GET /api/projects/:projectId/download
 *
 * Streams a ZIP archive of the project directory
 *
 * Response: application/zip stream
 * Errors:
 * - 404: Project not found
 */
router.get('/projects/:projectId/download', async (req: Request, res: Response) => {
  const { projectId } = req.params;

  try {
    // Resolve project path (validates path safety)
    const projectPath = await getProjectService().getProjectPath(projectId);

    // Stream ZIP download
    await downloadService.streamZipDownload(projectPath, projectId, res);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new UserError('Project not found', 404);
    }
    throw error;
  }
});

export default router;
