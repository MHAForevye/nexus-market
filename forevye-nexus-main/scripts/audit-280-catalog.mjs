#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const catalogPath=path.join(root,'docs/catalog-280/CATALOG_280.json');
const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
const items=catalog.items;
const errors=[], warnings=[];
const ids=new Set(), collections=new Set();
const orientations={portrait:0,landscape:0};
const statuses={};
for(const item of items){
  if(ids.has(item.id)) errors.push(`duplicate id: ${item.id}`);
  ids.add(item.id); collections.add(item.collection);
  if(!(item.orientation in orientations)) errors.push(`${item.id}: invalid orientation ${item.orientation}`);
  else orientations[item.orientation]++;
  if(item.stock_total!==2) errors.push(`${item.id}: stock_total != 2`);
  if(item.max_qty_per_user!==1) errors.push(`${item.id}: max_qty_per_user != 1`);
  statuses[item.asset_status]=(statuses[item.asset_status]||0)+1;
  if(!item.art_direction || item.art_direction.trim().length<10) warnings.push(`${item.id}: art_direction missing/short`);
}
if(items.length!==360) errors.push(`catalog total ${items.length}, expected 360`);
if(collections.size!==16) errors.push(`collection total ${collections.size}, expected 16`);
if(orientations.portrait!==167 || orientations.landscape!==193) warnings.push(`orientation distribution differs from expected 167/193`);
console.log(JSON.stringify({total:items.length,collections:collections.size,orientations,statuses,errors,warnings},null,2));
if(errors.length) process.exit(1);
