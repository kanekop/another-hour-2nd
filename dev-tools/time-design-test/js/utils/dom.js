/**
 * A simple shorthand for querySelector.
 * @param {string} selector - The CSS selector.
 * @param {Document|Element} [scope=document] - The scope to search within.
 * @returns {Element|null}
 */
export function $(selector, scope = document) {
    return scope.querySelector(selector);
}

/**
 * A simple shorthand for querySelectorAll.
 * @param {string} selector - The CSS selector.
 * @param {Document|Element} [scope=document] - The scope to search within.
 * @returns {NodeListOf<Element>}
 */
export function $$(selector, scope = document) {
    return scope.querySelectorAll(selector);
} 