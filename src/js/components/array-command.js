(function(){

const template = document.createElement('template');
template.innerHTML =`
<style>
  :host{
    display: inline-flex;
    width: 100%;
    border-radius: 10px;
    overflow: hidden;
    height: 100%;
  }
</style>
<slot></slot>`;

customElements.define('array-command', class extends HTMLElement {
    constructor()
    {
        super();

        let shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.appendChild(template.content.cloneNode(true));

        this.addEventListener('click', ev => {
          if(!('index' in ev.target.dataset)) return;
          
          this.dispatchEvent(new CustomEvent('command', {
            bubbles: true,
            detail: {
              type: this.dataset.type,
              index: ev.target.dataset.index
          }}));
        });
    }

    connectedCallback(){}
});

})();
