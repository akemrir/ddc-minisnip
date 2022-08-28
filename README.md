# ddc minisnip

It uses vim tags variable with list of tag files and queries it with supplied command to get list of tags for ddc menu.

## Required

### denops.vim

https://github.com/vim-denops/denops.vim

### ddc.vim

https://github.com/Shougo/ddc.vim

## setup

Set up vim:

```
Plug 'akemrir/ddc-minisnip'
```

```
call ddc#custom#patch_global('sources', ['minisnip'])
call ddc#custom#patch_global('sourceParams', {
\  'minisnip': {
\    'home': $HOME,
\    'dirs': g:miniSnip_dirs,
\    'extend': g:miniSnip_extends
\  })
```
