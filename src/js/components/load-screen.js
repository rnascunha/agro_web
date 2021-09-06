(function(){

const template = document.createElement('template');
template.innerHTML =`
<style>
    :host
    {
      display: flex;
      justify-content: center;
      align-items: center;
      position: fixed;
      box-sizing: border-box;
      padding: 0;
      margin: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(50, 50, 50, 0.5);
      font-size: 50%;
      z-index: 1000;
      overflow: hidden;
    }

    .icon{
      display: flex;
      justify-content: center;
      align-items: center;
      width: 50%;
      height: 50%;
      font-size: 200px;
      z-index: 1001;
      color: rgb(200, 200, 200, 0.9);
    }
</style>
<slot class=icon></slot>`;

customElements.define('load-screen', class extends HTMLElement {
    constructor()
    {
        super();

        let shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.appendChild(template.content.cloneNode(true));
    }

    connectedCallback(){}

    show()
    {
      this.style.display = 'flex';
    }

    hide()
    {
      this.style.display = 'none';
    }
});

})();
