(function(){

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host
  {
    --border-radius: 5px;
    --bar-color: #3063A5;
    --text-color: #fff;
    width: 100px;
    background: #cccccc;
    position: relative;
    overflow: hidden;
    display: inline-block;
    padding: 1px;
    border-radius: var(--border-radius);
    height: 40px;
  }

  #bar
  {
    background: var(--bar-color);
    text-align: center;
    border-radius: var(--border-radius);
    height: 100%;
    width: 0;
  }

  #bar span {
    color: var(--text-color);
    position: absolute;
    width: 100%;
    left: 0;
    display: inline-flex;
    height: 100%;
    justify-content: center;
    align-items: center;
  }
</style>
<div id="bar"><span></span></div>`;

customElements.define('progress-bar', class extends HTMLElement {
    constructor()
    {
      super();

      let shadowRoot = this.attachShadow({mode: 'open'});
      shadowRoot.appendChild(template.content.cloneNode(true));

      this._bar = shadowRoot.querySelector('#bar');
      this._text = shadowRoot.querySelector('#bar span');
    }

    connectedCallback()
    {
      if(this.hasAttribute('text'))
      {
        this.text = this.getAttribute('text');
      }
    }

    set text(val)
    {
      this._text.textContent = val;
    }

    set progress(progress)
    {
      if(typeof progress != 'number' || (progress < 0 || progress > 100)) return;
      this._bar.style.width = `${progress}%`;
    }

    update(progress, text = '')
    {
      this.progress = progress;
      this.text = text;
    }
});

})();
