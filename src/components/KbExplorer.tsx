import {
  IconChevron,
  IconClose,
  IconFolder,
  IconPage,
  IconPlus,
  IconSearch,
} from "@/components/icons";
import { ScreenHeader } from "@/components/ScreenHeader";
import { cn } from "@/lib/cn";
import {
  childrenOf,
  descendantIds,
  displayKbTitle,
  folderPath,
  isKbFolder,
  isKbPage,
  searchKbPages,
} from "@/lib/kb";
import { useKbExplorerStore } from "@/store/useKbExplorerStore";
import { useKbStore } from "@/store/useKbStore";
import { useUiStore } from "@/store/useUiStore";
import type { LifelyKbFolder, LifelyKbPage } from "@/types";
import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";

type AddMenu =
  | { kind: "header" }
  | { kind: "folder"; id: string }
  | null;

export function KbExplorer({ variant }: { variant: "page" | "sidebar" }) {
  const compact = variant === "sidebar";
  const nodes = useKbStore((state) => state.nodes);
  const addFolder = useKbStore((state) => state.addFolder);
  const addPage = useKbStore((state) => state.addPage);
  const openKbPage = useUiStore((state) => state.openKbPage);
  const kbPageId = useUiStore((state) => state.kbPageId);
  const query = useKbExplorerStore((state) => state.query);
  const setQuery = useKbExplorerStore((state) => state.setQuery);
  const expanded = useKbExplorerStore((state) => state.expanded);
  const createParentId = useKbExplorerStore((state) => state.createParentId);
  const setCreateParentId = useKbExplorerStore(
    (state) => state.setCreateParentId,
  );
  const expandFolders = useKbExplorerStore((state) => state.expandFolders);
  const collapseFolders = useKbExplorerStore((state) => state.collapseFolders);
  const [menu, setMenu] = useState<AddMenu>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const rootItems = childrenOf(nodes, null);
  const createParent = nodes.find(
    (node) => node.id === createParentId && isKbFolder(node),
  );
  const expandedSet = new Set(expanded);
  const searching = query.trim().length > 0;

  useEffect(() => {
    if (!menu) return;
    function onPointer(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-kb-add-menu]")) return;
      setMenu(null);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [menu]);

  useEffect(() => {
    if (!kbPageId) return;
    const page = nodes.find((node) => node.id === kbPageId && isKbPage(node));
    if (!page) return;
    expandFolders(folderPath(nodes, page.parentId).map((folder) => folder.id));
  }, [expandFolders, kbPageId, nodes]);

  useEffect(() => {
    if (!compact || !kbPageId) return;
    listRef.current
      ?.querySelector("[data-kb-active-page]")
      ?.scrollIntoView({ block: "nearest" });
  }, [compact, kbPageId]);

  function toggleFolder(id: string) {
    const folder = nodes.find((node) => node.id === id && isKbFolder(node));
    const isOpen = expandedSet.has(id);
    if (isOpen) {
      collapseFolders(new Set(descendantIds(nodes, id)));
      const parentId = folder?.parentId ?? null;
      if (parentId && expandedSet.has(parentId)) setCreateParentId(parentId);
    } else {
      expandFolders([id]);
      setCreateParentId(id);
    }
  }

  function selectFolder(id: string) {
    setCreateParentId(id);
    expandFolders([id]);
  }

  function createPageIn(parentId: string | null) {
    const page = addPage(parentId);
    setMenu(null);
    if (parentId) {
      setCreateParentId(parentId);
      expandFolders([parentId]);
    }
    openKbPage(page.id, parentId);
  }

  function createFolderIn(parentId: string | null) {
    const folder = addFolder(parentId);
    setMenu(null);
    const next = [folder.id];
    if (parentId) next.unshift(parentId);
    expandFolders(next);
    setCreateParentId(folder.id);
  }

  const tree = searching ? (
    <KbSearchHits query={query} compact={compact} />
  ) : rootItems.length === 0 ? (
    <p
      className={cn(
        "text-center text-ink-secondary",
        compact ? "px-2 py-8 text-[13px]" : "px-3 py-20 text-[15px]",
      )}
    >
      Nema stranica. Dodaj folder ili stranicu dugmetom +
    </p>
  ) : (
    <KbTree
      parentId={null}
      depth={0}
      ancestorsLast={[]}
      compact={compact}
      expanded={expandedSet}
      createParentId={createParentId}
      menu={menu}
      onToggleFolder={toggleFolder}
      onSelectFolder={selectFolder}
      onOpenMenu={(id) =>
        setMenu((current) =>
          current?.kind === "folder" && current.id === id
            ? null
            : { kind: "folder", id },
        )
      }
      onAddPage={createPageIn}
      onAddFolder={createFolderIn}
    />
  );

  const searchField = (
    <div
      className={cn(
        "flex items-center gap-2 bg-surface-2/90 px-2.5",
        compact ? "h-9 rounded-xl" : "h-11 rounded-2xl px-3",
      )}
    >
      <IconSearch
        className={cn(
          "shrink-0 text-ink-tertiary",
          compact ? "size-3.5" : "size-4",
        )}
      />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Pronađi stranicu"
        aria-label="Pronađi stranicu"
        className={cn(
          "min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-tertiary",
          compact ? "text-[13px]" : "text-[15px]",
        )}
      />
      {query ? (
        <button
          type="button"
          aria-label="Obriši pretragu"
          onClick={() => setQuery("")}
          className="grid size-6 place-items-center text-ink-tertiary"
        >
          <IconClose className="size-3.5" />
        </button>
      ) : null}
    </div>
  );

  const addButton = (
    <div className="relative shrink-0" data-kb-add-menu>
      <button
        type="button"
        aria-label="Dodaj"
        aria-expanded={menu?.kind === "header"}
        onClick={() =>
          setMenu((current) =>
            current?.kind === "header" ? null : { kind: "header" },
          )
        }
        className={
          compact
            ? "grid size-9 place-items-center rounded-xl text-accent hover:bg-accent/12"
            : "icon-btn text-accent hover:bg-accent/12"
        }
      >
        <IconPlus className={compact ? "size-5" : "size-6"} />
      </button>
      {menu?.kind === "header" ? (
        <KbAddMenu
          className={compact ? "top-10" : "top-12"}
          onPage={() => createPageIn(createParentId)}
          onFolder={() => createFolderIn(createParentId)}
        />
      ) : null}
    </div>
  );

  if (compact) {
    return (
      <div
        className="mt-4 flex min-h-0 flex-1 flex-col border-t border-hairline pt-4"
        aria-label="Knowledge stranice"
      >
        <div className="flex shrink-0 items-center gap-1.5 px-0.5">
          <div className="min-w-0 flex-1">{searchField}</div>
          {addButton}
        </div>
        <div
          ref={listRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5 pb-4 pt-2"
        >
          {tree}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScreenHeader
        title="Knowledge"
        subtitle={
          createParent ? (
            <p className="mt-2 truncate text-[13px] text-ink-secondary">
              Novo se dodaje u: {displayKbTitle(createParent.title)}
            </p>
          ) : null
        }
        actions={addButton}
      />
      <div className="shrink-0 px-3 pb-1 md:px-6">{searchField}</div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-8 pt-3 md:px-6">
        {tree}
      </div>
    </div>
  );
}

type TreeHandlers = {
  compact: boolean;
  expanded: Set<string>;
  createParentId: string | null;
  menu: AddMenu;
  onToggleFolder: (id: string) => void;
  onSelectFolder: (id: string) => void;
  onOpenMenu: (id: string) => void;
  onAddPage: (parentId: string | null) => void;
  onAddFolder: (parentId: string | null) => void;
};

function KbTree({
  parentId,
  depth,
  ancestorsLast,
  ...handlers
}: {
  parentId: string | null;
  depth: number;
  ancestorsLast: boolean[];
} & TreeHandlers) {
  const nodes = useKbStore((state) => state.nodes);
  const items = childrenOf(nodes, parentId);

  return (
    <div>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        if (isKbFolder(item)) {
          return (
            <KbFolderNode
              key={item.id}
              node={item}
              depth={depth}
              ancestorsLast={ancestorsLast}
              isLast={isLast}
              {...handlers}
            />
          );
        }
        return (
          <KbPageNode
            key={item.id}
            node={item}
            depth={depth}
            ancestorsLast={ancestorsLast}
            isLast={isLast}
            compact={handlers.compact}
          />
        );
      })}
    </div>
  );
}

function KbFolderNode({
  node,
  depth,
  ancestorsLast,
  isLast,
  compact,
  expanded,
  createParentId,
  menu,
  onToggleFolder,
  onSelectFolder,
  onOpenMenu,
  onAddPage,
  onAddFolder,
}: {
  node: LifelyKbFolder;
  depth: number;
  ancestorsLast: boolean[];
  isLast: boolean;
} & TreeHandlers) {
  const updateNode = useKbStore((state) => state.updateNode);
  const requestDeleteKb = useUiStore((state) => state.requestDeleteKb);
  const childCount = useKbStore(
    (state) => childrenOf(state.nodes, node.id).length,
  );
  const open = expanded.has(node.id);
  const selected = createParentId === node.id;
  const menuOpen = menu?.kind === "folder" && menu.id === node.id;
  return (
    <div>
      <TreeRow
        depth={depth}
        ancestorsLast={ancestorsLast}
        isLast={isLast}
        compact={compact}
        active={selected && !compact}
        onClick={() => onSelectFolder(node.id)}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "Zatvori folder" : "Otvori folder"}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFolder(node.id);
          }}
          className={cn(
            "grid shrink-0 place-items-center",
            compact ? "size-6" : "size-7",
          )}
        >
          <IconChevron
            className={cn(
              "text-ink-tertiary transition-transform",
              compact ? "size-3" : "size-3.5",
              open ? "-rotate-90" : "rotate-180",
            )}
          />
        </button>
        <button
          type="button"
          onClick={() => onSelectFolder(node.id)}
          className={cn(
            "grid shrink-0 place-items-center",
            compact ? "size-6" : "size-7",
          )}
        >
          <IconFolder
            className={cn(
              "text-ink-secondary",
              compact ? "size-4" : "size-[18px]",
            )}
          />
        </button>
        <input
          value={node.title}
          aria-label="Naziv foldera"
          onFocus={() => onSelectFolder(node.id)}
          onChange={(event) =>
            updateNode(node.id, { title: event.target.value })
          }
          onBlur={() => {
            if (!node.title.trim()) {
              updateNode(node.id, { title: "Novi folder" });
            }
          }}
          className={cn(
            "min-w-0 flex-1 bg-transparent font-medium text-ink outline-none",
            compact ? "px-1 text-[13px]" : "px-1.5 text-[15px]",
          )}
        />
        {childCount > 0 ? (
          <span
            className={cn(
              "kb-hover-count tabular-nums text-ink-tertiary",
              compact ? "px-1 text-[11px]" : "px-1.5 text-[13px]",
              menuOpen && "hidden",
            )}
          >
            {childCount}
          </span>
        ) : null}
        <div
          className="kb-hover-actions relative items-center pr-0.5"
          data-open={menuOpen ? "true" : undefined}
          data-kb-add-menu
        >
          <button
            type="button"
            aria-label="Dodaj u folder"
            aria-expanded={menuOpen}
            onClick={(event) => {
              event.stopPropagation();
              onSelectFolder(node.id);
              onOpenMenu(node.id);
            }}
            className={cn(
              "grid place-items-center rounded-md text-ink-tertiary hover:bg-surface-2 hover:text-ink",
              compact ? "size-7" : "size-8",
            )}
          >
            <IconPlus className={compact ? "size-3.5" : "size-4"} />
          </button>
          {menuOpen ? (
            <KbAddMenu
              onPage={() => onAddPage(node.id)}
              onFolder={() => onAddFolder(node.id)}
            />
          ) : null}
          <button
            type="button"
            aria-label="Obriši folder"
            onClick={(event) => {
              event.stopPropagation();
              requestDeleteKb("kb-folder", node.id);
            }}
            className={cn(
              "grid place-items-center rounded-md text-ink-tertiary hover:bg-surface-2 hover:text-danger",
              compact ? "size-7" : "size-8",
            )}
          >
            <IconClose className={compact ? "size-3.5" : "size-4"} />
          </button>
        </div>
      </TreeRow>
      {open ? (
        <KbTree
          parentId={node.id}
          depth={depth + 1}
          ancestorsLast={depth === 0 ? [] : [...ancestorsLast, isLast]}
          compact={compact}
          expanded={expanded}
          createParentId={createParentId}
          menu={menu}
          onToggleFolder={onToggleFolder}
          onSelectFolder={onSelectFolder}
          onOpenMenu={onOpenMenu}
          onAddPage={onAddPage}
          onAddFolder={onAddFolder}
        />
      ) : null}
    </div>
  );
}

function KbPageNode({
  node,
  depth,
  ancestorsLast,
  isLast,
  compact,
}: {
  node: LifelyKbPage;
  depth: number;
  ancestorsLast: boolean[];
  isLast: boolean;
  compact: boolean;
}) {
  const openKbPage = useUiStore((state) => state.openKbPage);
  const kbPageId = useUiStore((state) => state.kbPageId);
  const setCreateParentId = useKbExplorerStore(
    (state) => state.setCreateParentId,
  );
  const requestDeleteKb = useUiStore((state) => state.requestDeleteKb);
  const title = displayKbTitle(node.title, node.createdAt);
  const active = kbPageId === node.id;

  function openPage() {
    setCreateParentId(node.parentId);
    openKbPage(node.id, node.parentId);
  }

  return (
    <TreeRow
      data-kb-active-page={active ? "true" : undefined}
      depth={depth}
      ancestorsLast={ancestorsLast}
      isLast={isLast}
      compact={compact}
      active={active}
      onClick={openPage}
    >
      <span className={cn("shrink-0", compact ? "size-6" : "size-7")} />
      <span
        className={cn(
          "grid shrink-0 place-items-center",
          compact ? "size-6" : "size-7",
        )}
      >
        <IconPage
          className={cn(
            "text-ink-secondary",
            compact ? "size-4" : "size-[18px]",
          )}
        />
      </span>
      <span
        title={title}
        className={cn(
          "min-w-0 flex-1 truncate text-left",
          compact ? "px-1 text-[13px]" : "px-1.5 text-[15px]",
          active && "font-medium text-accent",
        )}
      >
        {title}
      </span>
      <button
        type="button"
        aria-label="Obriši stranicu"
        onClick={(event) => {
          event.stopPropagation();
          requestDeleteKb("kb-page", node.id);
        }}
        className={cn(
          "kb-hover-delete mr-0.5 grid shrink-0 place-items-center rounded-md text-ink-tertiary hover:text-danger",
          compact ? "size-7" : "size-8",
        )}
      >
        <IconClose className={compact ? "size-3.5" : "size-4"} />
      </button>
    </TreeRow>
  );
}

function KbSearchHits({
  query,
  compact,
}: {
  query: string;
  compact: boolean;
}) {
  const nodes = useKbStore((state) => state.nodes);
  const pages = searchKbPages(nodes, query);
  const openKbPage = useUiStore((state) => state.openKbPage);
  const kbPageId = useUiStore((state) => state.kbPageId);

  if (pages.length === 0) {
    return (
      <p
        className={cn(
          "text-ink-secondary",
          compact ? "px-2 py-6 text-[13px]" : "px-3 py-10 text-[15px]",
        )}
      >
        Nema podudaranja
      </p>
    );
  }

  return (
    <div>
      {pages.map((page) => {
        const title = displayKbTitle(page.title, page.createdAt);
        const path = folderPath(nodes, page.parentId)
          .map((folder) => displayKbTitle(folder.title))
          .join(" / ");
        const active = kbPageId === page.id;
        return (
          <button
            key={page.id}
            type="button"
            data-kb-active-page={active ? "true" : undefined}
            onClick={() => openKbPage(page.id, page.parentId)}
            className={cn(
              "flex w-full flex-col justify-center px-2 text-left transition-colors duration-150",
              compact ? "min-h-9 rounded-md py-1" : "min-h-11 rounded-lg py-1.5",
              active
                ? "bg-accent/10 font-medium shadow-[inset_2px_0_0_0_var(--accent)]"
                : "hover:bg-ink/[0.055]",
            )}
          >
            <span
              className={cn(
                "truncate",
                compact ? "text-[13px]" : "text-[15px]",
                active && "font-medium text-accent",
              )}
            >
              {title}
            </span>
            {path ? (
              <span className="truncate text-[11px] text-ink-tertiary">
                {path}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function TreeRow({
  depth,
  ancestorsLast,
  isLast,
  compact,
  active = false,
  children,
  className,
  ...attrs
}: {
  depth: number;
  ancestorsLast: boolean[];
  isLast: boolean;
  compact: boolean;
  active?: boolean;
  children: ReactNode;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">) {
  return (
    <div
      className={cn("flex items-stretch", compact ? "h-9" : "h-11")}
      {...attrs}
    >
      <TreeGutter
        depth={depth}
        ancestorsLast={ancestorsLast}
        isLast={isLast}
        compact={compact}
      />
      <div
        className={cn(
          "group flex min-w-0 flex-1 cursor-pointer items-center transition-colors duration-150",
          compact ? "rounded-md" : "rounded-lg",
          active
            ? "bg-accent/10 shadow-[inset_2px_0_0_0_var(--accent)]"
            : "hover:bg-ink/[0.055]",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

function TreeGutter({
  depth,
  ancestorsLast,
  isLast,
  compact,
}: {
  depth: number;
  ancestorsLast: boolean[];
  isLast: boolean;
  compact: boolean;
}) {
  if (depth === 0) return null;
  const width = compact ? "w-4" : "w-5";
  const height = compact ? "h-9" : "h-11";
  const left = compact ? "left-[8px]" : "left-[10px]";

  return (
    <div className={cn("flex shrink-0 self-stretch", height)} aria-hidden>
      {ancestorsLast.map((parentIsLast, index) => (
        <span key={index} className={cn("relative", width)}>
          {parentIsLast ? null : (
            <span className={cn("absolute inset-y-0 w-px bg-ink/20", left)} />
          )}
        </span>
      ))}
      <span className={cn("relative", width)}>
        <span className={cn("absolute top-0 h-[14px] w-px bg-ink/20", left)} />
        {!isLast ? (
          <span
            className={cn(
              "absolute bottom-0 top-[22px] w-px bg-ink/20",
              left,
            )}
          />
        ) : null}
        <span
          className={cn(
            "absolute top-[14px] h-2 w-2.5 rounded-bl-[7px] border-b border-l border-ink/20",
            compact ? "left-[8px]" : "left-[10px]",
          )}
        />
      </span>
    </div>
  );
}

function KbAddMenu({
  onPage,
  onFolder,
  className,
}: {
  onPage: () => void;
  onFolder: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-2xl py-1 shadow-[var(--shadow-float)]",
        className,
      )}
    >
      <button
        type="button"
        onClick={onPage}
        className="flex min-h-11 w-full items-center gap-2 px-3.5 text-left text-[15px]"
      >
        <IconPage className="size-[18px] text-ink-secondary" />
        Nova stranica
      </button>
      <button
        type="button"
        onClick={onFolder}
        className="flex min-h-11 w-full items-center gap-2 px-3.5 text-left text-[15px]"
      >
        <IconFolder className="size-[18px] text-ink-secondary" />
        Novi folder
      </button>
    </div>
  );
}
