const htmlparser2 = require('htmlparser2');
const cheerio = require('cheerio');

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
    const dom = htmlparser2.parseDOM(content, {
        withDomLvl1        : true,
        normalizeWhitespace: false,
        xmlMode            : true,
        decodeEntities     : true
    });
    const $ = cheerio.load(dom);

    const result = new CheerioInfo(content);

    $(selector).each(function (i, elem) {
        $(elem).attr(attrName, attrValue);
        result.updated = true;
    });

    if (result.updated) {
        result.content = $.xml();
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
export function renameAttribute(content: string, selector: string, attrNameOld: string, attrNameNew: string): CheerioInfo {
    const dom = htmlparser2.parseDOM(content, {
        withDomLvl1        : true,
        normalizeWhitespace: false,
        xmlMode            : true,
        decodeEntities     : false
    });
    const $ = cheerio.load(dom, {decodeEntities: false});

    const result = new CheerioInfo(content);

    $(selector).each(function (i, elem) {
        const attrNameNoBindingOld = attrNameOld;
        const attrNameNoBindingNew = attrNameNew;
        const attrValueNoBinding = $(elem).attr(attrNameNoBindingOld);
        if (attrValueNoBinding) {
            $(elem).removeAttr(attrNameNoBindingOld);
            $(elem).attr(attrNameNoBindingNew, attrValueNoBinding);
            result.updated = true;
        }

        const attrNameDataBindingOld = '[' + attrNameOld + ']';
        const attrNameDataBindingNew = '[' + attrNameNew + ']';
        const attrNameDataBindingValue = $(elem).attr(attrNameDataBindingOld);
        if (attrNameDataBindingValue) {
            $(elem).removeAttr(attrNameDataBindingOld);
            $(elem).attr(attrNameDataBindingNew, attrNameDataBindingValue);
            result.updated = true;
        }

        const attrNameTwoWayBindingOld = '[(' + attrNameOld + ')]';
        const attrNameTwoWayBindingNew = '[(' + attrNameNew + ')]';
        const attrValueTwoWayBinding = $(elem).attr(attrNameTwoWayBindingOld);
        if (attrValueTwoWayBinding) {
            $(elem).removeAttr(attrNameTwoWayBindingOld);
            $(elem).attr(attrNameTwoWayBindingNew, attrValueTwoWayBinding);
            result.updated = true;
        }

        const attrNameEventBindingOld = '(' + attrNameOld + ')';
        const attrNameEventBindingNew = '(' + attrNameNew + ')';
        const attrValueEventBinding = $(elem).attr(attrNameEventBindingOld);
        if (attrValueEventBinding) {
            $(elem).removeAttr(attrNameEventBindingOld);
            $(elem).attr(attrNameEventBindingNew, attrValueEventBinding);
            result.updated = true;
        }
    });

    if (result.updated) {
        result.content = $.xml();
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
    const dom = htmlparser2.parseDOM(content, {
        withDomLvl1        : true,
        normalizeWhitespace: false,
        xmlMode            : true,
        decodeEntities     : false
    });
    const $ = cheerio.load(dom, {decodeEntities: false});

    const result = new CheerioInfo(content);

    $(selector).each(function (i, elem) {
        const attrNameNoBinding = attrName;
        if ($(elem).attr(attrNameNoBinding)) {
            $(elem).attr(attrNameNoBinding, attrValue);
            result.updated = true;
        }

        const attrNameDataBinding = '[' + attrName + ']';
        if ($(elem).attr(attrNameDataBinding)) {
            $(elem).attr(attrNameDataBinding, attrValue);
            result.updated = true;
        }

        const attrNameTwoWayBinding = '[(' + attrName + ')]';
        if ($(elem).attr(attrNameTwoWayBinding)) {
            $(elem).attr(attrNameTwoWayBinding, attrValue);
            result.updated = true;
        }

        const attrNameEventBinding = '(' + attrName + ')';
        if ($(elem).attr(attrNameEventBinding)) {
            $(elem).attr(attrNameEventBinding, attrValue);
            result.updated = true;
        }
    });

    if (result.updated) {
        result.content = $.xml();
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
    const dom = htmlparser2.parseDOM(content, {
        withDomLvl1        : true,
        normalizeWhitespace: false,
        xmlMode            : true,
        decodeEntities     : false
    });
    const $ = cheerio.load(dom, {decodeEntities: false});

    const result = new CheerioInfo(content);

    $(selector).each(function (i, elem) {
        const attrNameNoBinding = attrName;
        if ($(elem).attr(attrNameNoBinding)) {
            $(elem).removeAttr(attrNameNoBinding);
            result.updated = true;
        }

        const attrNameDataBinding = '[' + attrName + ']';
        if ($(elem).attr(attrNameDataBinding)) {
            $(elem).removeAttr(attrNameDataBinding);
            result.updated = true;
        }

        const attrNameTwoWayBinding = '[(' + attrName + ')]';
        if ($(elem).attr(attrNameTwoWayBinding)) {
            $(elem).removeAttr(attrNameTwoWayBinding);
            result.updated = true;
        }

        const attrNameEventBinding = '(' + attrName + ')';
        if ($(elem).attr(attrNameEventBinding)) {
            $(elem).removeAttr(attrNameEventBinding);
            result.updated = true;
        }
    });

    if (result.updated) {
        result.content = $.xml();
    }

    return result;
}
