(function(){

const template = document.createElement('template');
template.innerHTML =`
<style>
    :host
    {
      display: none;
      justify-content: center;
      align-items: center;
      position: fixed;
      box-sizing: border-box;
      padding: 0;
      margin: 0;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(50, 50, 50, 0.5);
      z-index: 1002;
      overflow: hidden;
      --inner-width: auto;
      --min-inner-width: auto;
      --max-inner-width: 50%;
    }

    .pop-up{
      width: var(--inner-width);
      max-width: var(--max-inner-width);
      min-width: var(--min-inner-width);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1003;
    }

    @media only screen and (max-width: 600px) {
      :host{
        --max-inner-width: 98%;
      }
    }
</style>
<slot class=pop-up></slot>`;

customElements.define('pop-modal', class extends HTMLElement {
    constructor()
    {
        super();

        let shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.appendChild(template.content.cloneNode(true));

        this.addEventListener('click', ev => {
          if(ev.target == this)
          {
            this.dispatchEvent(new Event('cancel'));
          }
        })
    }

    connectedCallback()
    {
      if(this.hasAttribute('show'))
      {
        this.show();
      }
    }

    show()
    {
      this.style.display = 'flex';
    }

    hide()
    {
      this.style.display = 'none';
    }

    delete()
    {
      this.parentNode.removeChild(this);
    }
});

})();
