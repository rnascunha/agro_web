(function(){

const template = document.createElement('template');
template.innerHTML =`
<style>
  :host{
    display: inline-block;
    font-size: 18px;
    --color-placeholder: rgba(200, 200, 200, 0.9);
  }

  fieldset{
    border: 1px solid var(--text-color);
    border-radius: 10px;
    box-sizing: border-box;
  }

  input{
    width: 100%;
    margin: 0px;
    outline: none;
    font-size: inherit;
    background-color: inherit;
    color: inherit;
    text-align: center;
    font-family: inherit;
    /* flex: 4 1 auto; */
    border: none;
    min-width: 0;
    font-family: inherit;
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
<fieldset>
  <legend><slot name=field>Field</slot></legend>
  <input>
</fieldset>`;

customElements.define('overtext-input', class extends HTMLElement {
    constructor()
    {
        super();

        let shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.appendChild(template.content.cloneNode(true));

        this._input = shadowRoot.querySelector('input');

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
