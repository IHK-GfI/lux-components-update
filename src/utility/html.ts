import { replaceAll } from './util';

const cheerio = require('cheerio');
const luxCheerioParserOptions = { xmlMode: true, decodeEntities: false, selfClosingTags: false };
const emptyPlaceholderToken = '@20c44b9d-45e1-447a-a141-1de0695c9c35@';

export class CheerioInfo {
  content: string;
  updated: boolean;

  constructor(content: string) {
    this.content = content;
    this.updated = false;
  }
}

/**
 * Diese Methode fügt ein neues Attribut hinzu, das zum Selektor passt.
 *
 * @param content
 * @param selector
 * @param attrName
 * @param attrValue
 */
export function addAttribute(content: string, selector: string, attrName: string, attrValue: string): CheerioInfo {
  let newContent = preProcessing(content);
  const $ = cheerio.load(newContent, luxCheerioParserOptions);
  const result = new CheerioInfo(newContent);

  $(selector).each(function (i, elem) {
    $(elem).attr(attrName, attrValue ? attrValue : emptyPlaceholderToken);
    result.updated = true;
  });

  if (result.updated) {
    result.content = $.xml();
    result.content = postProcessing(result.content);
  }

  return result;
}

/**
 * Diese Methode fügt den Wert ans Ende des Attributwertes an, das zum Selektor passt.
 *
 * @param content
 * @param selector
 * @param attrName
 * @param attrValue
 */
export function appendAttribute(content: string, selector: string, attrName: string, attrValue: string): CheerioInfo {
  let newContent = preProcessing(content);
  const $ = cheerio.load(newContent, luxCheerioParserOptions);
  const result = new CheerioInfo(newContent);

  $(selector).each(function (i, elem) {
    const attrNameNoBinding = attrName;
    if ($(elem).attr(attrNameNoBinding)) {
      $(elem).attr(attrNameNoBinding, $(elem).attr(attrNameNoBinding) + attrValue);
      result.updated = true;
    }

    const attrNameDataBinding = '[' + attrName + ']';
    if ($(elem).attr(attrNameDataBinding)) {
      $(elem).attr(attrNameDataBinding, $(elem).attr(attrNameDataBinding) + attrValue);
      result.updated = true;
    }

    const attrNameTwoWayBinding = '[(' + attrName + ')]';
    if ($(elem).attr(attrNameTwoWayBinding)) {
      $(elem).attr(attrNameTwoWayBinding, $(elem).attr(attrNameTwoWayBinding) + attrValue);
      result.updated = true;
    }

    const attrNameEventBinding = '(' + attrName + ')';
    if ($(elem).attr(attrNameEventBinding)) {
      $(elem).attr(attrNameEventBinding, $(elem).attr(attrNameEventBinding) + attrValue);
      result.updated = true;
    }
  });

  if (result.updated) {
    result.content = $.xml();
    result.content = postProcessing(result.content);
  }

  return result;
}

/**
 * Diese Methode benennt ein Attribut um, die zum Selektor passen.
 *
 * @param content Der Inhalt eines HTML-Templates.
 * @param selector Ein beliebiger Selektor (z.B. lux-list).
 * @param attrNameOld Ein beliebiger Attributname (z.B. luxItem).
 * @param attrNameNew Ein beliebiger neuer Attributname.
 */
export function renameAttribute(
  content: string,
  selector: string,
  attrNameOld: string,
  attrNameNew: string
): CheerioInfo {
  let newContent = preProcessing(content);
  const $ = cheerio.load(newContent, luxCheerioParserOptions);

  const result = new CheerioInfo(newContent);

  $(selector).each(function (i, elem) {
    const attrNameNoBindingOld = attrNameOld;
    const attrNameNoBindingNew = attrNameNew;
    const attrValueNoBinding = $(elem).attr(attrNameNoBindingOld);
    if (attrValueNoBinding) {
      $(elem).removeAttr(attrNameNoBindingOld);
      $(elem).attr(attrNameNoBindingNew, attrValueNoBinding ? attrValueNoBinding : emptyPlaceholderToken);
      result.updated = true;
    }

    const attrNameDataBindingOld = '[' + attrNameOld + ']';
    const attrNameDataBindingNew = '[' + attrNameNew + ']';
    const attrNameDataBindingValue = $(elem).attr(attrNameDataBindingOld);
    if (attrNameDataBindingValue) {
      $(elem).removeAttr(attrNameDataBindingOld);
      $(elem).attr(attrNameDataBindingNew, attrNameDataBindingValue ? attrNameDataBindingValue : emptyPlaceholderToken);
      result.updated = true;
    }

    const attrNameTwoWayBindingOld = '[(' + attrNameOld + ')]';
    const attrNameTwoWayBindingNew = '[(' + attrNameNew + ')]';
    const attrValueTwoWayBinding = $(elem).attr(attrNameTwoWayBindingOld);
    if (attrValueTwoWayBinding) {
      $(elem).removeAttr(attrNameTwoWayBindingOld);
      $(elem).attr(attrNameTwoWayBindingNew, attrValueTwoWayBinding ? attrValueTwoWayBinding : emptyPlaceholderToken);
      result.updated = true;
    }

    const attrNameEventBindingOld = '(' + attrNameOld + ')';
    const attrNameEventBindingNew = '(' + attrNameNew + ')';
    const attrValueEventBinding = $(elem).attr(attrNameEventBindingOld);
    if (attrValueEventBinding) {
      $(elem).removeAttr(attrNameEventBindingOld);
      $(elem).attr(attrNameEventBindingNew, attrValueEventBinding ? attrValueEventBinding : emptyPlaceholderToken);
      result.updated = true;
    }
  });

  if (result.updated) {
    result.content = $.xml();
    result.content = postProcessing(result.content);
  }

  return result;
}

/**
 * Diese Methode setzt den neuen Wert für das Attribut, die zum Selektor passen.
 *
 * @param content Der Inhalt eines HTML-Templates.
 * @param selector Ein beliebiger Selektor (z.B. lux-list).
 * @param attrName Ein beliebiger Attributname (z.B. luxItem).
 * @param attrValue Ein beliebiger Wert.
 */
export function updateAttribute(content: string, selector: string, attrName: string, attrValue: string): CheerioInfo {
  let newContent = preProcessing(content);
  const $ = cheerio.load(newContent, luxCheerioParserOptions);

  const result = new CheerioInfo(newContent);

  $(selector).each(function (i, elem) {
    const attrNameNoBinding = attrName;
    if ($(elem).attr(attrNameNoBinding)) {
      $(elem).attr(attrNameNoBinding, attrValue ? attrValue : emptyPlaceholderToken);
      result.updated = true;
    }

    const attrNameDataBinding = '[' + attrName + ']';
    if ($(elem).attr(attrNameDataBinding)) {
      $(elem).attr(attrNameDataBinding, attrValue ? attrValue : emptyPlaceholderToken);
      result.updated = true;
    }

    const attrNameTwoWayBinding = '[(' + attrName + ')]';
    if ($(elem).attr(attrNameTwoWayBinding)) {
      $(elem).attr(attrNameTwoWayBinding, attrValue ? attrValue : emptyPlaceholderToken);
      result.updated = true;
    }

    const attrNameEventBinding = '(' + attrName + ')';
    if ($(elem).attr(attrNameEventBinding)) {
      $(elem).attr(attrNameEventBinding, attrValue ? attrValue : emptyPlaceholderToken);
      result.updated = true;
    }
  });

  if (result.updated) {
    result.content = $.xml();
    result.content = postProcessing(result.content);
  }

  return result;
}

/**
 * Diese Methode entfernt das Attribut für alle Elemente, die zum Selektor passen.
 *
 * @param content Der Inhalt eines HTML-Templates.
 * @param selector Ein beliebiger Selektor (z.B. lux-list).
 * @param attrName Ein beliebiger Attributname (z.B. luxListItem).
 */
export function removeAttribute(content: string, selector: string, attrName: string): CheerioInfo {
  let newContent = preProcessing(content);
  const $ = cheerio.load(newContent, luxCheerioParserOptions);

  const result = new CheerioInfo(newContent);

  $(selector).each(function (i, elem) {
    const attrNameNoBinding = attrName;
    let updated = false;

    if ($(elem).attr(attrNameNoBinding)) {
      $(elem).removeAttr(attrNameNoBinding);
      updated = true;
    }

    const attrNameDataBinding = '[' + attrName + ']';
    if ($(elem).attr(attrNameDataBinding)) {
      $(elem).removeAttr(attrNameDataBinding);
      updated = true;
    }

    const attrNameTwoWayBinding = '[(' + attrName + ')]';
    if ($(elem).attr(attrNameTwoWayBinding)) {
      $(elem).removeAttr(attrNameTwoWayBinding);
      updated = true;
    }

    const attrNameEventBinding = '(' + attrName + ')';
    if ($(elem).attr(attrNameEventBinding)) {
      $(elem).removeAttr(attrNameEventBinding);
      updated = true;
    }

    if (updated) {
      result.updated = true;
    }
  });

  if (result.updated) {
    result.content = $.xml();
    result.content = postProcessing(result.content);
  }

  return result;
}

function preProcessing(content: string) {
  return replaceAll(content, '=""', `="${emptyPlaceholderToken}"`);
}

function postProcessing(content: string) {
  let resultContent = content;

  // Entferne alle leeren Werte die von Cheerio hinzugefügt wurden.
  resultContent = replaceAll(resultContent, `=""`, '');
  // Setze alle Attribute wieder auf leer (="") die initial bereits leer waren oder gezielt auf leer gesetzt wurden.
  resultContent = replaceAll(resultContent, `${emptyPlaceholderToken}`, '');
  // Entferne alle Closing-Tags von den Void-Tags.
  resultContent = replaceAll(resultContent, '</input>', '');
  resultContent = replaceAll(resultContent, '</area>', '');
  resultContent = replaceAll(resultContent, '</br>', '');
  resultContent = replaceAll(resultContent, '</base>', '');
  resultContent = replaceAll(resultContent, '</col>', '');
  resultContent = replaceAll(resultContent, '</embed>', '');
  resultContent = replaceAll(resultContent, '</hr>', '');
  resultContent = replaceAll(resultContent, '</img>', '');
  resultContent = replaceAll(resultContent, '</link>', '');
  resultContent = replaceAll(resultContent, '</meta>', '');
  resultContent = replaceAll(resultContent, '</param>', '');
  resultContent = replaceAll(resultContent, '</source>', '');
  resultContent = replaceAll(resultContent, '</track>', '');
  resultContent = replaceAll(resultContent, '</wbr>', '');

  return resultContent;
}

const getAllAttributes = function (node) {
  return node.attributes || Object.keys(node.attribs).map((name) => ({ name, value: node.attribs[name] }));
};
