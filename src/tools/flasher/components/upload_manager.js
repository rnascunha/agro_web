(function(){

customElements.define('upload-manager', class extends HTMLElement {
    constructor()
    {
      super();
            
      this._container = [];
      this._disabled = false;
      this.addEventListener('file', ev => {
        ev.stopPropagation();
        if(ev.detail.file)
        {
          this.add();
        }
        else
        {
          this.remove(ev.target);
        }
      });

      this._add();
    }

    connectedCallback()
    {

    }

    get value()
    {
      return this._container.map(el => el.value);
    }

    add()
    {
      if(this._container.length && !this._container[this._container.length - 1].value.file)
      {
        return;
      }

      this._add();
    }

    remove(el)
    {
      if(this._container.length == 1) return;
      el.remove();
      this._container = this._container.filter(e => e != el);
      /**
       * Garantie that will have the last container empty
       */
      if(this._container[this._container.length - 1].value.file)
      {
        this.add();
      }
    }

    _add()
    {
      const el = document.createElement('image-uploader');
      this.appendChild(el);
      el.innerHTML = '<i slot=upload-button class="fas fa-file-import"></i>';
      el.disabled = this._disabled;
      this._container.push(el);
    }

    set disabled(val)
    {
      this._disabled = Boolean(val);
      this._container.forEach(el => {
        el.disabled = this._disabled;
      });
    }
});

})();
