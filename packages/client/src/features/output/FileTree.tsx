import {
  UncontrolledTreeEnvironment,
  Tree,
  StaticTreeDataProvider,
  TreeItem,
} from 'react-complex-tree';
import 'react-complex-tree/lib/style-modern.css';
import type { FileNode } from '@repo/shared';

interface FileTreeProps {
  fileTree: Record<string, FileNode>;
  onSelectFile: (node: FileNode) => void;
}

/**
 * Formats file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

/**
 * File tree component for browsing output files
 */
export function FileTree({ fileTree, onSelectFile }: FileTreeProps) {
  // Convert FileNode map to TreeItem format for react-complex-tree
  const treeItems: Record<string, TreeItem> = {};

  Object.entries(fileTree).forEach(([id, node]) => {
    treeItems[id] = {
      index: id,
      data: node,
      children: node.children || [],
      isFolder: node.isDirectory,
      canMove: false,
      canRename: false,
    };
  });

  const dataProvider = new StaticTreeDataProvider(treeItems, (item, data) => ({
    ...item,
    data,
  }));

  // Find root ID (node with no parent or explicit root)
  const rootId =
    Object.keys(fileTree).find(
      (id) => fileTree[id]?.path === '' || fileTree[id]?.path === '/'
    ) || Object.keys(fileTree)[0] || 'root';

  return (
    <div className="border rounded-lg overflow-hidden">
      <UncontrolledTreeEnvironment
        dataProvider={dataProvider}
        getItemTitle={(item) => {
          const node = item.data as FileNode;
          const sizeStr = node.size ? ` (${formatFileSize(node.size)})` : '';
          return `${node.name}${sizeStr}`;
        }}
        viewState={{}}
        canDragAndDrop={false}
        canDropOnFolder={false}
        canReorderItems={false}
        onSelectItems={(items) => {
          const itemId = items[0];
          if (itemId) {
            const item = treeItems[itemId];
            if (item && !item.isFolder) {
              onSelectFile(item.data as FileNode);
            }
          }
        }}
        renderItemTitle={({ item }) => {
          const node = item.data as FileNode;
          return (
            <span className="flex items-center gap-2">
              <span>{node.name}</span>
              {node.size && (
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(node.size)}
                </span>
              )}
            </span>
          );
        }}
      >
        <div className="p-4 max-h-96 overflow-auto">
          <Tree treeId="file-tree" rootItem={rootId} treeLabel="Output Files" />
        </div>
      </UncontrolledTreeEnvironment>
    </div>
  );
}
