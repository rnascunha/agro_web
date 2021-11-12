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


    .header{
        display: flex;
        /* justify-content: center;
        align-content: center; */
        font-size: 22px;
        width: 100%;
        padding: 5px;
    }

    .icon
    {
      width: 7%;
    }

    .title{
      width: 100%;
      /* text-decoration: underline; */
      text-align: center;
      display: inline-block;
      /* background-color: var(--primary-color-dark); */
      /* cursor: pointer; */
    }

    ::slotted(.div)
    {
      width: 100%;
    }

    .content{
      width: 100%;
      text-align: center;
      vertical-align: middle;
      display: block;
    }
</style>
<div class=header>
  <slot class=icon name=icon></slot>
  <slot class=title name=title></slot>
</div>
<slot class=content></slot>`;

customElements.define('detail-command', class extends HTMLElement {
    constructor()
    {
        super();

        let shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.appendChild(template.content.cloneNode(true));
    }

    connectedCallback()
    {
    }
});

})();
