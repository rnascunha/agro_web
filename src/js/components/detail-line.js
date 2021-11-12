(function(){

const template = document.createElement('template');
template.innerHTML =`
<style>
    :host
    {
      width: 100%;
      display: flex;
      font-size: 20px;
      align-items: center;
    }

    :host(:hover)
    {
        background-color: var(--primary-color);
    }

    .icon{
      width: 7%;
      text-align: center;
      display: inline-block;
    }

    .text{
      font-weight: bold;
      width: 30%;
      padding-left: 10px;
      display: inline-block;
    }

    .value{
      width: 100%;
      text-align: center;
      vertical-align: middle;
      display: inline-block;
      word-break: break-word;
      flex-grow: 4;
      /* shine effect */
      position: relative;
      overflow: hidden;
    }
</style>
<slot class=icon name=icon></slot>
<slot class=text name=name></slot>
<slot class=value></slot>`;

customElements.define('detail-line', class extends HTMLElement {
    constructor()
    {
        super();

        let shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.appendChild(template.content.cloneNode(true));
    }

    connectedCallback()
    {

    }
});

})();
