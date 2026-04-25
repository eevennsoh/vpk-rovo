"use client";

import type { HTMLAttributes, ReactNode } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronRightIcon,
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
} from "@/components/ui/vpk-icons";
import { cn } from "@/lib/utils";
import {
  createContext,
  useCallback,
  use,
  useMemo,
  useState,
} from "react";

interface FileTreeContextType {
  expandedPaths: Set<string>;
  togglePath: (path: string) => void;
  selectedPath?: string;
  onSelect?: (path: string) => void;
}

// Default noop for context default value
// oxlint-disable-next-line eslint(no-empty-function)
const noop = () => {};

const FileTreeContext = createContext<FileTreeContextType>({
  // oxlint-disable-next-line eslint-plugin-unicorn(no-new-builtin)
  expandedPaths: new Set(),
  togglePath: noop,
});

export type FileTreeProps = Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> & {
  expanded?: Set<string>;
  defaultExpanded?: Set<string>;
  selectedPath?: string;
  onSelect?: (path: string) => void;
  onExpandedChange?: (expanded: Set<string>) => void;
};

export function FileTree({
  expanded: controlledExpanded,
  defaultExpanded = new Set(),
  selectedPath,
  onSelect,
  onExpandedChange,
  className,
  children,
  ...props
}: Readonly<FileTreeProps>) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const expandedPaths = controlledExpanded ?? internalExpanded;

  const togglePath = useCallback(
    (path: string) => {
      const newExpanded = new Set(expandedPaths);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      setInternalExpanded(newExpanded);
      onExpandedChange?.(newExpanded);
    },
    [expandedPaths, onExpandedChange]
  );

  const contextValue = useMemo(
    () => ({ expandedPaths, onSelect, selectedPath, togglePath }),
    [expandedPaths, onSelect, selectedPath, togglePath]
  );

  return (
    <FileTreeContext value={contextValue}>
      <div
        className={cn(
          "rounded-lg bg-background font-mono text-sm",
          className
        )}
        role="tree"
        {...props}
      >
        <div>{children}</div>
      </div>
    </FileTreeContext>
  );
}

interface FileTreeFolderContextType {
  path: string;
  name: string;
  isExpanded: boolean;
}

const FileTreeFolderContext = createContext<FileTreeFolderContextType>({
  isExpanded: false,
  name: "",
  path: "",
});

export type FileTreeFolderProps = HTMLAttributes<HTMLDivElement> & {
  path: string;
  name: string;
};

export function FileTreeFolder({
  path,
  name,
  className,
  children,
  ...props
}: Readonly<FileTreeFolderProps>) {
  const { expandedPaths, togglePath, selectedPath, onSelect } =
    use(FileTreeContext);
  const isExpanded = expandedPaths.has(path);
  const isSelected = selectedPath === path;

  const handleOpenChange = useCallback(() => {
    togglePath(path);
  }, [togglePath, path]);

  const handleSelect = useCallback(() => {
    onSelect?.(path);
  }, [onSelect, path]);

  const folderContextValue = useMemo(
    () => ({ isExpanded, name, path }),
    [isExpanded, name, path]
  );

  return (
    <FileTreeFolderContext value={folderContextValue}>
      <Collapsible onOpenChange={handleOpenChange} open={isExpanded}>
        <div
          className={cn("", className)}
          role="treeitem"
          tabIndex={0}
          {...props}
        >
          <div
            className={cn(
              "flex w-full items-center gap-1 rounded px-2 py-1 text-left transition-colors hover:bg-muted/50",
              isSelected && "bg-muted"
            )}
          >
            <CollapsibleTrigger
              render={
                <button
                  className="flex shrink-0 items-center border-none bg-transparent p-0"
                  type="button"
                />
              }
            >
              <ChevronRightIcon
                size="small"
                className={cn(
                  "shrink-0 leading-[0] text-muted-foreground transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            </CollapsibleTrigger>
            <button
              className="flex min-w-0 flex-1 items-center gap-1 border-none bg-transparent p-0 text-left"
              onClick={handleSelect}
              type="button"
            >
              <FileTreeIcon>
                {isExpanded ? (
                  <FolderOpenIcon size="small" className="text-blue-500" />
                ) : (
                  <FolderIcon size="small" className="text-blue-500" />
                )}
              </FileTreeIcon>
              <FileTreeName>{name}</FileTreeName>
            </button>
          </div>
          <CollapsibleContent>
            <div className="ml-4 border-l pl-2">{children}</div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </FileTreeFolderContext>
  );
}

interface FileTreeFileContextType {
  path: string;
  name: string;
}

const FileTreeFileContext = createContext<FileTreeFileContextType>({
  name: "",
  path: "",
});

export type FileTreeFileProps = HTMLAttributes<HTMLDivElement> & {
  path: string;
  name: string;
  icon?: ReactNode;
};

export function FileTreeFile({
  path,
  name,
  icon,
  className,
  children,
  ...props
}: Readonly<FileTreeFileProps>) {
  const { selectedPath, onSelect } = use(FileTreeContext);
  const isSelected = selectedPath === path;

  const handleClick = useCallback(() => {
    onSelect?.(path);
  }, [onSelect, path]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        onSelect?.(path);
      }
    },
    [onSelect, path]
  );

  const fileContextValue = useMemo(() => ({ name, path }), [name, path]);

  return (
    <FileTreeFileContext value={fileContextValue}>
      <div
        className={cn(
          "flex cursor-pointer items-center gap-1 rounded px-2 py-1 transition-colors hover:bg-muted/50",
          isSelected && "bg-muted",
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="treeitem"
        tabIndex={0}
        {...props}
      >
        {children ?? (
          <>
            {/* Spacer for alignment */}
            <span className="size-4 shrink-0" />
            <FileTreeIcon>
              {icon ?? <FileIcon size="small" className="text-muted-foreground" />}
            </FileTreeIcon>
            <FileTreeName>{name}</FileTreeName>
          </>
        )}
      </div>
    </FileTreeFileContext>
  );
}

export type FileTreeIconProps = HTMLAttributes<HTMLSpanElement>;

export function FileTreeIcon({
  className,
  children,
  ...props
}: Readonly<FileTreeIconProps>) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center leading-none",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export type FileTreeNameProps = HTMLAttributes<HTMLSpanElement>;

export function FileTreeName({
  className,
  children,
  ...props
}: Readonly<FileTreeNameProps>) {
  return (
    <span className={cn("truncate", className)} {...props}>
      {children}
    </span>
  );
}

export type FileTreeActionsProps = HTMLAttributes<HTMLDivElement>;

const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation();

export function FileTreeActions({
  className,
  children,
  ...props
}: Readonly<FileTreeActionsProps>) {
  return (
    <div
      className={cn("ml-auto flex items-center gap-1", className)}
      onClick={stopPropagation}
      onKeyDown={stopPropagation}
      role="group"
      {...props}
    >
      {children}
    </div>
  );
}
