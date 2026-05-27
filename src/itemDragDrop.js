const itemDragMimeType = "application/x-pt2-item-key";

function removePrivateFields(item) {
  return Object.fromEntries(
    Object.entries(item).filter(([key]) => !key.startsWith("_")),
  );
}

function getDraggedItemKey(event) {
  return (
    event.dataTransfer.getData(itemDragMimeType) ||
    event.dataTransfer.getData("text/plain")
  );
}

function startItemDrag(event, itemKey) {
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(itemDragMimeType, itemKey);
  event.dataTransfer.setData("text/plain", itemKey);
}

async function mergeDraggedItemInto(event, targetItemKey) {
  const sourceItemKey = getDraggedItemKey(event);
  if (!sourceItemKey || sourceItemKey === targetItemKey) {
    return;
  }

  const items = await browser.storage.sync.get(null);
  const sourceItem = items[sourceItemKey];
  const targetItem = items[targetItemKey];

  if (!sourceItem || !targetItem) {
    return;
  }

  const targetRootKey = targetItem.linkedTo || targetItemKey;
  if (sourceItemKey === targetRootKey) {
    return;
  }

  const updates = {
    [sourceItemKey]: removePrivateFields({
      ...sourceItem,
      linkedTo: targetRootKey,
    }),
  };

  for (const [key, item] of Object.entries(items)) {
    if (item.linkedTo === sourceItemKey) {
      updates[key] = removePrivateFields({
        ...item,
        linkedTo: targetRootKey,
      });
    }
  }

  await browser.storage.sync.set(updates);
}

export { mergeDraggedItemInto, startItemDrag };
