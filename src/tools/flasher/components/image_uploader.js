import {is_hex_char, read_file} from '../utility.js';

(function(){

const image_types = {
  'bootloader.bin': {name: 'bootloader', offset: 0x1000},
  'partition-table.bin': {name: 'partition-table', offset: 0x8000},
  'ota_data_initial.bin': {name: 'ota_data_initial', offset: 0xd000},
};

const user_app_offset = 0x10000;

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host{
    display: inline-flex;
    gap: 2px;
    align-items: stretch;
  }

  :host([disabled]) #button-upload
  {
      cursor: not-allowed;
      opacity: 0.7;
  }

  * {
    box-sizing: border-box;
  }

  #image-check
  {
    align-self: center;
    cursor: pointer;
  }

  .file-input
  {
    position:fixed;
    top:-100em;
    opacity:0;
  }

  .left-container
  {
    border-radius: 5px 0px 0px 5px;
    border-top: 1px solid black;
    border-bottom: 1px solid black;
    border-left: 1px solid black;
    border-right: none;
  }

  .right-container
  {
    border-radius: 0px 5px 5px 0px;
    border-top: 1px solid black;
    border-bottom: 1px solid black;
    border-right: 1px solid black;
    border-left: none;
  }

  #file-container
  {
    display: inline-flex;
    max-width: 100%;
    align-items: stretch;
    overflow: hidden;
    flex: 1 1 auto;
  }

  #file-input-container
  {
    cursor: pointer;
    flex: 1 1 auto;
    display: inline-flex;
    align-items: stretch;
    overflow: hidden;
  }

  .input-style{
    background-color: var(--primary-color-dark);
    text-align: center;
    font-size: 18px;
    color: var(--text-color);
    outline: none;
  }

  #file-name{
    /* width: 100%; */
    display: inline-flex;
    justify-content: center;
    align-items: center;
    white-space: nowrap;
    overflow: hidden;
    flex: 1 10 auto;
  }

  #erase-file
  {
    background-color: var(--primary-color-dark);
    font-size: 30px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
  }

  #erase-file:hover
  {
    background-color: var(--text-color);
    color: var(--primary-color-dark);
    /* font-weight: bold; */
    /* box-shadow: var(--hover-effect); */
    /* filter: brightness(90%); */
  }

  #image-offset
  {
    max-width: 10ch;
    font-family: var(--font-family);
    border: 1px solid black;
    border-radius: 5px;
  }

  #file-name:empty:after{
    content: 'File to flash';
    color: lightgrey;
    opacity: .7;
  }

  #button-upload
  {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    font-size: 22px;
  }

  input::-webkit-calendar-picker-indicator {
    opacity: 100;
  }

  @media only screen and (max-width: 600px) {
    :host{
      display: flex;
      width: 100%;
    }

    #file-input-container
    {
      width: 100%;
    }
  }
</style>
<div id=file-container>
  <input type=checkbox id=image-check checked></input>
  <label id=file-input-container>
    <input type="file" id=file-input class=file-input accept=".bin">
    <div id=file-name class='input-style left-container'></div>
  </label>
  <div id=erase-file title='Remove file' class=right-container>&times</div>
</div>
<input id='image-offset' list='default-image-offsets' class=input-style placeholder=Offset></input>
<span id=button-upload title='Flash file'><slot name=upload-button></slot></span>
<datalist id="default-image-offsets"></datalist>
</div>`;

customElements.define('image-uploader', class extends HTMLElement {
    constructor()
    {
      super();

      let shadowRoot = this.attachShadow({mode: 'open'});
      shadowRoot.appendChild(template.content.cloneNode(true));

      this._file = null;
      this._image = null;
      this._file_name = shadowRoot.querySelector('#file-name');
      this._file_input = shadowRoot.querySelector('#file-input');
      this._offset = shadowRoot.querySelector('#image-offset');
      this._checked = shadowRoot.querySelector('#image-check');

      this._offset.addEventListener('keydown', ev => {
        if(!('key' in ev) || ev.key.length > 1) return;

        if(!is_hex_char(ev.key))
        {
          ev.preventDefault();
        }
      });

      shadowRoot.querySelector('#erase-file')
        .addEventListener('click', ev => {
        this._file_name.textContent = '';
        this._file = null;
        this._image = null;
        this.dispatchEvent(new CustomEvent('file', {bubbles: true, detail: this.value}))
      });

      this._file_input
        .addEventListener('change', ev => {
        if(!ev.target.files.length) return;

        this._file = ev.target.files[0];
        this._file_name.textContent = ev.target.files[0].name;
        this._file_name.title = ev.target.files[0].name;
        this._offset.value = ev.target.files[0].name in image_types ?
                              image_types[ev.target.files[0].name].offset.toString(16) :
                              user_app_offset.toString(16);

        read_file(this._file).then(image => {
          this._image = image;
          this.dispatchEvent(new CustomEvent('file', {bubbles: true, detail: this.value}));
        });
      });

      shadowRoot.querySelector('#button-upload')
        .addEventListener('click', ev => {
          this.dispatchEvent(new CustomEvent('upload', {bubbles: true, detail: this.value}));
        });

      const datalist = shadowRoot.querySelector('#default-image-offsets');
      Object.values(image_types).forEach(v => {
        const op = document.createElement('option');
        op.value = v.offset.toString(16);
        op.textContent = v.name;

        datalist.appendChild(op);
      });

      const op = document.createElement('option');
      op.value = user_app_offset.toString(16);
      op.textContent = 'user_app';

      datalist.appendChild(op);
    }

    connectedCallback()
    {

    }

    get value()
    {
      return {
        offset: this._offset.value,
        file: this._file,
        checked: this._checked.checked,
        disabled: this.disabled,
        image: this._image
      }
    }

    set disabled(val)
    {
      if(Boolean(val))
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
