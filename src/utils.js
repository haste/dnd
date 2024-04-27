const diceValue = ({
  dice,
  modifier = "",
  modifierType,
  numDice = 1,
  sign = "",
  soloModifier,
}) => {
  if (soloModifier) {
    return `${numDice}d20${soloModifier}`;
  }

  if (modifierType) {
    // It's not too many cases where this will trigger, but it would be nice to
    // cache this a bit
    modifier = getAbilities()[modifierType];
  }
  if (+modifier < 0) {
    sign = "";
  }
  return `${numDice}d${dice}${sign}${modifier}`;
};

export const diceRegex =
  /((?<numDice>\d+)?d(?<dice>\d+)(?:\s*(?<sign>[+-])\s*(?:your (?<modifierType>\w+) modifier|(?<modifier>(?!\d+d\d+)\d+)))?|(?<soloModifier>[+-]\d+))/g;

export const talespireLink = (elem, label, dice, diceLabel) => {
  const anchor = document.createElement("a");
  anchor.classList.add("integrated-dice__container");
  anchor.classList.add("hijacked");
  anchor.dataset.tsLabel = label;
  anchor.dataset.tsDice = dice;
  anchor.onclick = (event) => {
    event.stopPropagation();

    let name = label;
    let extraDice = "";
    if (event.altKey || event.ctrlKey) {
      name += " (ADV/DIS)";
      extraDice = `/${dice}`;
    }
    window.open(
      `talespire://dice/${encodeURIComponent(name)}:${dice}${extraDice}`,
      "_self",
    );
  };

  if (diceLabel) {
    anchor.innerText = diceLabel;
  } else if (elem) {
    anchor.innerHTML = elem.innerHTML;
  } else {
    anchor.innerText = dice;
  }

  return anchor;
};

export const getTextNodes = (root) => {
  const treeWalker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    (node) =>
      !node.parentNode.classList.contains("hijacked") &&
      node.textContent.match(diceRegex)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP,
  );
  const textNodes = [];
  while (treeWalker.nextNode()) {
    textNodes.push(treeWalker.currentNode);
  }

  return textNodes;
};

export const getAbilities = () => {
  const abilities = Array.from(
    document.querySelectorAll(".ct-quick-info__ability"),
  ).reduce((acc, node) => {
    const stat = node.querySelector(".ddbc-ability-summary__label").textContent;

    let modifier = node.querySelector(".ddbc-signed-number").textContent;
    if (+modifier > 0) {
      modifier = modifier.slice(1);
    }

    acc[stat] = modifier;
    return acc;
  }, {});

  return abilities;
};

export const embedInText = (node, label) => {
  let offset = 0;
  let fragment;
  for (const match of node.textContent.matchAll(diceRegex)) {
    if (offset === 0) {
      fragment = new DocumentFragment();

      if (match.index !== 0) {
        fragment.appendChild(
          document.createTextNode(
            node.textContent.substring(offset, match.index),
          ),
        );
      }
    } else {
      fragment.appendChild(
        document.createTextNode(
          node.textContent.substring(offset, match.index),
        ),
      );
    }

    const link = talespireLink(null, label, diceValue(match.groups), match[0]);
    link.style = "padding-left: 4px; padding-right: 4px;";

    fragment.appendChild(link);
    offset = match.index + match[0].length;
  }

  if (fragment && offset !== node.textContent.length) {
    fragment.appendChild(
      document.createTextNode(
        node.textContent.substring(offset, node.textContent.length),
      ),
    );
  }

  if (fragment) {
    node.replaceWith(fragment);
  }
};
