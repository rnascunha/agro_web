(function(){

const template = document.createElement('template');
template.innerHTML =`
<style>
  :host{
    box-sizing: border-box;
    display: inline-flex;
    justify-content: stretch;
    align-items: center;
    border: 1px solid black;
    border-radius: 5px;
    font-size: 20px;
    --inner-padding: 5px;
    --icon-color: black;
    overflow: hidden;
  }

  .icon{
    box-sizing: border-box;
    font-size: inherit;
    padding: var(--inner-padding);
    margin: 0px;
    display: inline-flex;
    flex-direction: column;
    justify-content: center;
    border: none;
    flex: 0 10 auto;
    max-width: 4ch;
    color: var(--icon-color);
  }

  input{
    box-sizing: border-box;
    padding: var(--inner-padding);
    margin: 0px;
    outline: none;
    font-size: 20px;
    /* --input-font-size: 20px; */
    background-color: inherit;
    color: inherit;
    text-align: center;
    font-family: inherit;
    flex: 4 1 auto;
    border: none;
    min-width: 0;
    font-family: inherit;
  }

  .close{
    box-sizing: border-box;
    text-align: center;
    font-family: inherit;
    font-size: var(--close-font-size, inherit);
    flex: 0 10 auto;
    border: none;
    padding: var(--inner-padding);
    cursor: pointer;
    font-family: inherit;
    max-width: 3ch;
    color: var(--icon-color);
  }

  .close:hover{
    font-weight: bold;
  }

  ::placeholder { /* Chrome, Firefox, Opera, Safari 10.1+ */
    color: var(--color-placeholder);
  }

  :-ms-input-placeholder { /* Internet Explorer 10-11 */
    color: var(--color-placeholder);
  }

  ::-webkit-input-placeholder {
     color: var(--color-placeholder);
  }

  :-moz-placeholder { /* Firefox 18- */
     color: var(--color-placeholder);
  }
</style>
<span class=icon><slot name=icon></slot></span>
<input autocapitalize="none">
<span class=close>&times</span>`;

customElements.define('x-input-icon', class extends HTMLElement {
    constructor()
    {
        super();

        let shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.appendChild(template.content.cloneNode(true));

        this._icon = shadowRoot.querySelector('.icon');
        this._input = shadowRoot.querySelector('input');
        this._close = shadowRoot.querySelector('.close');

        this._close.addEventListener('click', ev => {
          this._input.value = '';
          this._input.focus();
        });

        this._input.addEventListener('keydown', ev => {
          if(ev.key == 'Escape')
          {
            ev.target.value = '';
            return;
          }
        });

        this.addEventListener = this._input.addEventListener;
    }

    set value(val){ this._input.value = val; }
    get value(){ return this._input.value; }

    set disabled(val)
    {
      this._input.disabled = Boolean(val);
      if(this._input.disabled)
      {
        this.setAttribute('disabled', '');
      }
      else
      {
        this.removeAttribute('disabled');
      }
    }
    get disabled(){ return this._input.disabled; }

    get input(){ return this._input; }

    focus()
    {
      this._input.focus();
    }

    connectedCallback()
    {
        if(this.hasAttribute('type'))
        {
            this._input.type = this.getAttribute('type');
        }

        if(this.hasAttribute('value'))
        {
            this._input.value = this.getAttribute('value');
        }

        if(this.hasAttribute('placeholder'))
        {
          this._input.placeholder = this.getAttribute('placeholder');
        }
    }
});

})();
