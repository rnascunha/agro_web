(function(){

const template = document.createElement('template');
template.innerHTML =`
<style>
    :host
    {
      display: inline-flex;
      padding: 0px;
      margin: 0px;
      --width-switch: 50px;
      --height-switch: 30px;
      --gap-switch: 4px;
      height: var(--height-switch, 30px);
      width: var(--width-switch, 50px);
      justify-content: center;
      align-items: center;
      --border: none;
      --bg-checked: #243d42;
      --bg-unchecked: #477a85;
      --color-ball: #e8f5f7;
    }

    /* disabling input */
    :host([disabled])
    {
      --bg-checked: rgba(40, 40, 40, 0.4);
      --bg-unchecked: rgba(40, 40, 40, 0.3);
      --color-ball: lightgrey;
    }

    :host([disabled]) label
    {
      cursor: default;
    }

    /* hide input */
    input[type="checkbox"]
    {
      width: 0;
      height: 0;
      visibility: hidden;
      display: none;
    }
    /* box */
    label
    {
      width: 100%;
      height: 100%;
      display:block;
      background-color: var(--bg-unchecked, #477a85);
      border-radius: var(--height-switch);
      border: var(--border, none);
      position: relative;
      cursor: pointer;
      transition: 0.5s;
      box-shadow: 0 0 50px #477a8550;
    }
    /* ball */
    label::after
    {
      content: "";
      width: calc(var(--height-switch) - var(--gap-switch));
      height: calc(var(--height-switch) - var(--gap-switch));
      background-color: var(--color-ball, #e8f5f7);
      position: absolute;
      border-radius: var(--height-switch);
      top: calc(var(--gap-switch) / 2);
      left: calc(var(--gap-switch) / 2);
      transition: 0.5s;
    }

    input:checked + label:after
    {
      left: calc(100% - calc(var(--gap-switch) / 2));
      transform: translateX(-100%);
    }

    input:checked + label
    {
      background-color: var(--bg-checked, #243d42);
    }

    label:active:after
    {
      width: calc(var(--height-switch) * 1.1);
    }
</style>
<input type="checkbox" name="switch" id="switch">
<label for="switch"></label>
`;

customElements.define('check-switch', class extends HTMLElement {
    constructor()
    {
        super();

        let shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.appendChild(template.content.cloneNode(true));

        this._input = shadowRoot.querySelector('#switch');
    }

    set checked(val)
    {
      this._input.checked = Boolean(val);
      if(this._input.checked)
      {
        this.setAttribute('checked', '');
      }
      else
      {
        this.removeAttribute('checked');
      }
    }
    get checked() { return this._input.checked; }

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

    connectedCallback()
    {
        if(this.hasAttribute('checked'))
        {
            this.checked = true;
        }
        if(this.hasAttribute('disabled'))
        {
          this.disabled = true;
        }
    }
});

})();
