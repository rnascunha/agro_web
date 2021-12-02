(function(){

const template = document.createElement('template');
template.innerHTML =`
<style>
    :host
    {
      display: flex;
      gap: 2px;
    }

    input[type=checkbox]
    {
      align-self: center;
    }

    select,
    input{
      border-radius: 5px;
      color: var(--text-color);
      background-color: var(--primary-color);
      outline: none;
      font-family: var(--font-family);
      font-size: 1em;
      border-color: rgb(170, 170, 170);
      text-align: center;
    }

    select:hover,
    input:hover
    {
      border-color: white;
    }

    .value{
      width: 7ch;
    }

    .close{
      font-size: 1.7em;
      cursor: pointer;
      transform: translateY(-2px);
    }

    .close:hover{
      font-weight: bold;
    }

    /* Chrome, Safari, Edge, Opera */
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    /* Firefox */
    input[type=number] {
      -moz-appearance: textfield;
    }
</style>
<input type=checkbox checked title='Enable/disable'>
<select class=sensors></select>
<select class=op>
  <option value=less>\<</option>
  <option value=less_equal>\<=</option>
  <option value=equal>=</option>
  <option value=greater_equal>\>=</option>
  <option value=greater>\></option>
</select>
<input class=value type=number value=0>
<span class=close>&times;</span>`;

customElements.define('sensor-notify', class extends HTMLElement {
    constructor()
    {
        super();

        this._shadowRoot = this.attachShadow({mode: 'open'});
        this._shadowRoot.appendChild(template.content.cloneNode(true));

        this._sensors = this._shadowRoot.querySelector('.sensors');

        this._shadowRoot.querySelector('.close')
          .addEventListener('click', ev => {
            this.parentNode.removeChild(this);
          })
    }

    connectedCallback()
    {
    }

    get value()
    {
      const sensor_op = this._shadowRoot.querySelector('.sensors').selectedOptions[0].value.split('@');
      return {
        enable: this._shadowRoot.querySelector('input[type=checkbox]').checked,
        sensor: {
          type: +sensor_op[0],
          index: +sensor_op[1]
        },
        operation: this._shadowRoot.querySelector('.op').selectedOptions[0].value,
        value: +this._shadowRoot.querySelector('.value').value
      }
    }

    set value(val)
    {
      this._shadowRoot.querySelector('input[type=checkbox]').checked = val.enabled;
      this._shadowRoot.querySelector('.sensors').value = `${val.sensor.type}@${val.sensor.index}`;
      this._shadowRoot.querySelector('.op').value = val.operation;
      this._shadowRoot.querySelector('.value').value = val.value;
    }

    add_sensor(name, value)
    {
      const op = document.createElement('option');
      op.textContent = name;
      op.value = value;

      this._sensors.appendChild(op);
    }
});

})();
