(function(){

const template = document.createElement('template');
template.innerHTML =`
<style>
    :host
    {
      display: inline-flex;
      flex-direction: column;
      width: 100%;
      border-radius: 15px;
      overflow: hidden;
    }

    .title{
      font-size: 22px;
      text-decoration: underline;
      width: 100%;
      text-align: center;
      background-color: var(--primary-color-dark);
      padding: 5px;
      cursor: pointer;
    }

    .content{
      width: 100%;
      text-align: center;
      vertical-align: middle;
      display: block;
    }
</style>
<slot class=title name=title></slot>
<slot class=content></slot>`;

customElements.define('expand-menu', class extends HTMLElement {
    constructor()
    {
        super();

        let shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.appendChild(template.content.cloneNode(true));

        this._content = shadowRoot.querySelector('.content');

        shadowRoot.querySelector('.title')
          .addEventListener('click', ev => {
            this.toggle();
          });
    }

    connectedCallback()
    {
      if(this.hasAttribute('show'))
      {
        this.show();
      }
      else if(this.hasAttribute('hide'))
      {
        this.hide();
      }
    }

    show()
    {
      this.removeAttribute('hide');
      this.setAttribute('show', '');
      this._content.style.display='block';
    }

    hide()
    {
      this.removeAttribute('show');
      this.setAttribute('hide', '');
      this._content.style.display = 'none';
    }

    toggle()
    {
        if(this._content.style.display == 'none')
        {
          this.show();
        }
        else
        {
          this.hide();
        }
    }
});

})();
