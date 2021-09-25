(function(){

const template = document.createElement('template');
template.innerHTML =`
<style>
    :host
    {
      position: relative;
    }

    .drop-menu{
      display: none;
      position: absolute;
      float: right;
      right: 0;
      background-color: white;
      color: black;
      border-radius: 5px;
      padding: 5px;
      outline: none;
    }
</style>
<span id=drop-button><slot name=drop-button></slot></span>
<select class=drop-menu><slot></slot></select>`;

customElements.define('drop-menu', class extends HTMLElement {
    constructor()
    {
        super();

        let shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.appendChild(template.content.cloneNode(true));

        this._button = shadowRoot.querySelector('#drop-button');
        this._menu = shadowRoot.querySelector('.drop-menu');
        this._button.addEventListener('click', ev => {
          this._menu.style.display = this._menu.style.display == 'block' ? 'none' : 'block';
        });

    }

    connectedCallback()
    {

    }

    hide()
    {
      this._menu.style.display = 'none';
    }
});

})();
