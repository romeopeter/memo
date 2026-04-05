import Quill from "quill/core";
import Toolbar from "quill/modules/toolbar";
import Bold from "quill/formats/bold";
import Italic from "quill/formats/italic";
import Header from "quill/formats/header";
import Blockquote from "quill/formats/blockquote";
import inline from "quill/blots/inline";

/* ------------------------------------------------ */

// Customer formatter: Highlighter
class HighlightBlot extends inline {
    static blotName = 'highlight';
    static tagName = "mark";
    static className = "highlight";

    static create(value: string) {
        const node = super.create();
        node.style.backgroundColor = value || "yellow";
        node.style.padding = "2px 4px";
        node.style.borderRadius = "3px";
        return node;
    }

    static formats(node: HTMLElement) {
        return node.style.backgroundColor;
    }
}

// Custom Formatter: Uppercase
class UppercaseBlot extends inline {
    static blotName = "uppercase";
    static tagName = "span";
    static className = "uppercase";

    static create() {
        const node = super.create();
        node.style.textTransform = "uppercase";
        node.style.fontWeight = '600';
        node.style.color = '#2563eb';
        return node;
    }

    static formats(node: HTMLElement) {
        return node.style.textTransform;
    }
}

// Register formats (no theme — we manage toolbar externally)
Quill.register({
    "modules/toolbar": Toolbar,
    "formats/bold": Bold,
    "formats/italic": Italic,
    "formats/header": Header,
    "formats/blockquote": Blockquote,
    "formats/highlight": HighlightBlot,
    "formats/uppercase": UppercaseBlot,
});

export default Quill;
