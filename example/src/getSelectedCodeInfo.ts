function AA() {
  for (let node of nodeList) {
    if (
      typeof node?.line?.start === "number" &&
      typeof node?.line?.end === "number" &&
      typeof node?.character?.start === "number" &&
      typeof node?.character?.end === "number" &&
      ((node?.line?.start > lineStart && node?.line?.end < lineEnd) ||
        (lineStart !== lineEnd &&
          node?.line?.start === lineStart &&
          node?.character?.start >= characterStart &&
          (node?.line?.end === lineEnd
            ? node?.character?.end <= characterEnd
            : node?.line?.end > lineEnd
            ? false
            : true)) ||
        (lineStart !== lineEnd &&
          node?.line?.end === lineEnd &&
          node.character.end <= characterEnd &&
          (node?.line?.start === lineStart
            ? node?.character.start >= characterStart
            : node?.line?.start < lineStart
            ? false
            : true)) ||
        (lineStart === lineEnd &&
          node?.line?.start === lineStart &&
          node?.line?.end === lineEnd &&
          node?.character?.start >= characterStart &&
          node.character.end <= characterEnd))
    ) {
      nodeIdsInSelectedNodes.add(node.id);
      selectedNodes.push(node);
    }
  }
}
