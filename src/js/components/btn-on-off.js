(function(){

const template = document.createElement('template');
template.innerHTML =`
<style>
  :host{
    display: inline-flex;
    width: 100%;
    align-items: center;
    border-radius: 10px;
    overflow: hidden;
    background-color: rgba(150, 150, 150, 0.5);
  }

  .index{
    font-weight: bold;
    padding: 0px 2px;
    display: inline-block;
    min-width: 13px;
  }

  .buttons{
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .buttons button
  {
    cursor: pointer;
    width: 100%;
    color: var(--text-color);
    background-color: var(--primary-color-dark);
    font-family: var(--font-family);
    padding: 6px 3px;
    flex-grow: 4;
  }

  :host([disabled]) .buttons button
  {
    pointer-events: none;
    border-style: none;
  }

  .buttons button:hover
  {
     font-weight: bold;
  }

  .buttons button:active
  {
    transform: translateY(2px);
  }

  .result
  {
    display: inline-block;
    padding: 0px 4px;
    font-size: 20px;
  }

  .result *{
    background-color: white;
    border-radius: 10px;
  }

  .on{
    color: lawngreen;
  }

  .off{
    color: red;
  }

  :host([data-on='false']) .on
  {
    display: none;
  }

  :host([data-on='false']) .off
  {
    display: inline-block;
  }

  :host([data-on='true']) .off
  {
    display: none;
  }

  :host([data-on='true']) .on
  {
    display: inline-block;
  }
</style>
<div class=index></div>
<div class=buttons>
  <button data-on=true>ON</button>
  <button data-on=false>OFF</button>
</div>
<div class=result data-on=false>
  <slot class=on name=on></slot>
  <slot class=off name=off></slot>
</div>`;

customElements.define('btn-on-off', class extends HTMLElement {
    constructor()
    {
        super();

        let shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.appendChild(template.content.cloneNode(true));

        this._buttons = shadowRoot.querySelector('.buttons');
        this._index = +this.dataset.index;
        this.state = false;

        shadowRoot.querySelector('.index').textContent = this._index;

        this._buttons.addEventListener('click', ev => {
          this.dispatchEvent(new CustomEvent('command', {
            bubbles: true,
            detail: {
              type: 'ac_load',
              index: this._index,
              on: ev.target.dataset.on
          }}));
        });
    }

    connectedCallback(){}

    set state(val)
    {
      this.dataset.on = Boolean(val);
    }

    set disabled(val)
    {
      if(val)
        this.setAttribute('disabled', '');
      else
        this.removeAttribute('disabled');
    }

    get disabled()
    {
      return this.hasAttribute('disabled');
    }
});

})();
