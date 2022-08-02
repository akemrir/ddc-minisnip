# ddc minisnip

It uses vim tags variable with list of tag files and queries it with supplied command to get list of tags for ddc menu.

## setup

Set up vim:

```
Plug 'akemrir/ddc-minisnip'
```

```
call ddc#custom#patch_global('sources', ['minisnip'])
call ddc#custom#patch_global('sourceParams', { 'minisnip': { 'home': $HOME, 'dirs': g:miniSnip_dirs })
```
