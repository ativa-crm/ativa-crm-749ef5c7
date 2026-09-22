export const designSystemCatalog = {
  core: ["Button", "Badge", "Card", "Avatar", "Separator", "Skeleton", "Icon"],
  forms: ["Input", "Label", "Textarea", "NativeSelect", "Checkbox", "Switch", "RadioGroup"],
  navigation: ["SidebarNav", "BottomNav", "Tabs", "SegmentedControl"],
  feedback: ["Alert", "Toast", "Progress"],
  overlays: ["Dialog", "DropdownMenu", "Tooltip"],
  patterns: [
    "StatTile",
    "ListRow",
    "KanbanCard",
    "DeadlineBadge",
    "StatusDot",
    "SectionHeading",
    "CartaoIndicador",
    "AnelMeta",
    "Barras",
    "BarrasFunil",
    "Painel",
    "Tabela",
    "BarraFerramentas",
  ],
  site: ["SiteButton", "ServiceCard", "SpecCard", "SpecGrid", "Chip", "SiteSectionHeading"],
} as const;

export const designSystemComponentCount = Object.values(designSystemCatalog).reduce(
  (total, components) => total + components.length,
  0,
);

export const designSystemSourcePaths = {
  components: "design-system/components",
  tokens: "design-system/tokens",
  guidelines: "design-system/guidelines",
  assets: "design-system/assets",
  referenceHtml: "design-system/referencia",
  templates: "design-system/ui_kits",
} as const;
