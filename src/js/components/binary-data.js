import {Byte_Array} from '../libs/byte_array/byte_array.js'
import {Data_Type} from '../libs/byte_array/types.js'

(function(){

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host{
    display: inline-flex;
    width: 100%;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid black;
  }

  textarea{
    color: var(--text-color);
    background-color: var(--primary-color);
    font-family: var(--font-family);
    resize: none;
    outline: none;
    flex-grow: 4;
    padding: 5px;
  }

  .data-type {
    display: flex;
    flex-direction: column;
  }

  button
  {
    cursor: pointer;
    color: var(--text-color);
    background-color: var(--primary-color-dark);
    font-family: var(--font-family);
    padding: 6px 6px;
    overflow: hidden;
  }

  button[data-selected='true']{
    border-style: inset;
  }
</style>
<textarea cols=4 placeholder=Payload></textarea>
<div class=data-type>
  <button value=text>Text</button>
  <button value=hex>Hex</button>
</div>`;

customElements.define('binary-data', class extends HTMLElement {
    constructor()
    {
      super();

      let shadowRoot = this.attachShadow({mode: 'open'});
      shadowRoot.appendChild(template.content.cloneNode(true));

      this._payload = shadowRoot.querySelector('textarea');
      this._text = shadowRoot.querySelector('button[value=text]');
      this._hex = shadowRoot.querySelector('button[value=hex]');

      shadowRoot.querySelector('.data-type')
        .addEventListener('click', ev => {
          this._payload.focus();
          this[ev.target.value]();
        });

      this.text();

      this._payload
        .addEventListener('keydown', ev => {
          if(ev.key.length == 1)
          {
            if(!Byte_Array.is_valid_char(ev.key, this._format))
            {
              ev.preventDefault();
              return;
            }
          }
        });
    }

    connectedCallback()
    {
      if(this.hasAttribute('readonly'))
      {
        // this._payload.readonly = true;
        this._payload.setAttribute('readonly', '');
      }
    }

    text()
    {
      if(this._format == 'text') return;

      this._text.dataset.selected = 'true';
      this._hex.dataset.selected = 'false';
      this._format = 'text';

      if(!this._payload.value.length) return;

      this._payload.value = Byte_Array.convert(this._payload.value, 'hex', 'text');
    }

    hex()
    {
      if(this._format == 'hex') return;

      this._text.dataset.selected = 'false';
      this._hex.dataset.selected = 'true';
      this._format = 'hex';

      if(!this._payload.value.length) return;

      this._payload.value = Byte_Array.convert(this._payload.value, 'text', 'hex');
    }

    get value_string()
    {
      return this._payload.value;
    }

    get value()
    {
      return Byte_Array.parse(this._payload.value, this._format);
    }

    set value(val)
    {
      this._payload.value = Byte_Array.to(val, this._format);
    }
});

})();
