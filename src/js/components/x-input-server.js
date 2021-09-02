import {input_key_only_integer} from '../libs/input_helper.js'

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

  #scheme{
    background-color: inherit;
    color: inherit;
    text-align: center;
    font-family: inherit;
    font-size: inherit;
    outline: none;
    box-sizing: border-box;
    border: none;
    margin: 0;
    padding: 0;
    align-self: stretch;
  }

  #scheme:focus{
    filter: brightness(0.9);
  }

  input{
    box-sizing: border-box;
    margin: 0px;
    outline: none;
    font-size: 20px;
    background-color: inherit;
    color: inherit;
    text-align: center;
    font-family: inherit;
    border: none;
    min-width: 0;
    font-family: inherit;
  }

  #addr{
    flex: 4 1 auto;
  }

  #port{
    flex: 1 1 auto;
    max-width: 6ch;
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

  .separator{
    max-width: 1ch;
    flex: 0 10 auto;
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
<select id="scheme">
  <option value="ws">ws</option>
  <option value="wss" selected>wss</option>
</select>
<input id=addr placeholder=Address>
<span class=separator>:</span>
<input id=port placeholder=Port pattern="[0-9]*" inputmode="numeric">
<span class=close>&times</span>`;

customElements.define('x-input-server', class extends HTMLElement {
    constructor()
    {
        super();

        let shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.appendChild(template.content.cloneNode(true));

        this._icon = shadowRoot.querySelector('.icon');
        this._scheme = shadowRoot.querySelector('#scheme');
        this._input_addr = shadowRoot.querySelector('#addr');
        this._input_port = shadowRoot.querySelector('#port');
        this._close = shadowRoot.querySelector('.close');

        this._close.addEventListener('click', ev => {
          this._input_addr.value = '';
          this._input_port.value = '';
          this._input_addr.focus();
        })

        this._input_port.addEventListener('keydown', ev => {
            if(ev.key == 'Escape')
            {
              ev.target.value = '';
              return;
            }
            input_key_only_integer(ev, 1, 65535);
        });
    }

    get scheme(){ return this._scheme.selectedOptions[0].value; }
    set scheme(val){ this._scheme.querySelector(`[value=${val}]`).selected = true; }

    set address(val){ this._input_addr.value = val; }
    get address(){ return this._input_addr.value; }

    set port(val){ this._input_port.value = val; }
    get port(){ return this._input_port.value; }

    get input_addr(){ return this._input_addr; }
    get input_port(){ return this._input_port; }

    connectedCallback()
    {
        if(this.hasAttribute('addr'))
        {
            this._input_addr.value = this.getAttribute('addr');
        }

        if(this.hasAttribute('port'))
        {
          this._input_port.value = this.getAttribute('port');
        }
    }
});

})();
