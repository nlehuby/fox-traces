class TransportThumbnail extends HTMLElement {
    constructor() {
        super();
        this._shadowRoot = this.attachShadow({
            mode: 'open'
        });
    }

    connectedCallback() {
        let network = this.getAttribute("data-transport-network");
        let lineColour = this.getAttribute("data-transport-line-color");
        let lineCode = this.getAttribute("data-transport-line-code");
        let mode = this.getAttribute("data-transport-mode");
        let destination = this.getAttribute("data-transport-destination");

        let displayMode = ''
        switch (mode) {
            case 'bus':
                displayMode = '🚍';
                break;
            case 'train':
                displayMode = '🚆';
                break;
            case 'subway':
            case 'metro':
                displayMode = '🚇';
                break;
            case 'tramway':
            case 'tram':
                displayMode = '🚊';
                break;
            case 'ferry':
                displayMode = '⛴️';
                break;
            case 'walking_bus':
                displayMode = '🚶';
                break;

            default:
                displayMode = '🚍';
                break;
        }

        let html = `
    <style>
        .transport_thumbnail {
            border-bottom-width: 4px;
            border-bottom-style: solid;
            border-bottom-left-radius: 3px;
            border-bottom-right-radius: 3px;
            border-bottom-color:${
                lineColour || "white"
            };
        }
    </style>

    <span class="transport_thumbnail">
        ${ network ? "["+ network +"]" : ""}
        ${displayMode}
        ${lineCode || "??"}
    </span>
    ${ destination ? "> "+ destination : ""}
    `;

        this._shadowRoot.innerHTML = html;
    }
}
customElements.define('transport-thumbnail', TransportThumbnail);
