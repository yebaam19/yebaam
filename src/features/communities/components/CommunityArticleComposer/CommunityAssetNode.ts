import { Node } from '@tiptap/core';

export const CommunityAssetNode = Node.create({
  name: 'communityAsset',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      assetId: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-community-asset-id'),
        renderHTML: (attrs: { assetId: string }) => ({ 'data-community-asset-id': attrs.assetId }),
      },
    };
  },
  parseHTML() { return [{ tag: 'figure[data-community-asset-id]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['figure', HTMLAttributes, ['figcaption', {}, 'Medio de la biblioteca']];
  },
});
