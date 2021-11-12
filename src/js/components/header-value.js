(function(){

const template = document.createElement('template');
template.innerHTML =`
<style>
    :host
    {
      display: inline-flex;
      font-size: 15px;
      align-items: stretch;
      border: 1px solid black;
      border-radius: 4px;
    }

    .name
    {
      background-color: var(--primary-color-dark);
      padding: 3px;
      font-weight: bold;
    }

    .value
    {
      background-color: var(--primary-color-light);
      padding: 3px;
    }
</style>
<div class=name></div>
<div class=value></div>`;

customElements.define('header-value', class extends HTMLElement {
    constructor()
    {
        super();

        let shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.appendChild(template.content.cloneNode(true));

        this._name = shadowRoot.querySelector('.name');
        this._value = shadowRoot.querySelector('.value');
    }

    connectedCallback()
    {
      if(this.hasAttribute('name'))
      {
        this._name.textContent = this.getAttribute('name');
      }
    }

    get name()
    {
      return this._name.textContent;
    }

    set name(val)
    {
      this._name.textContent = val
    }

    get value()
    {
      return this._value.textContent;
    }

    set value(val)
    {
      this._value.textContent = val;
    }
});

})();
