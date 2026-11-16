import test from 'node:test';
import assert from 'node:assert/strict';
import { controllerFamily, controllerButtonName, controllerGlyph, validPromptStyle } from '../../src/ui/controller-prompts.js';

test('recognizes PlayStation and Xbox descriptors but leaves unknown layouts positional',()=>{
  for (const id of ['DualSense Wireless Controller','Wireless Controller (Vendor: 054c Product: 0ce6)','DualShock 4']) assert.equal(controllerFamily(id),'playstation');
  for (const id of ['Xbox Wireless Controller (STANDARD GAMEPAD)','Microsoft XInput','Vendor: 045e']) assert.equal(controllerFamily(id),'xbox');
  assert.equal(controllerFamily('Unknown Standard Gamepad'),'generic');
  assert.equal(controllerFamily('Nintendo Switch Pro Controller'),'generic');
});

test('manual family selection works when a browser masks the controller identity',()=>{
  assert.equal(controllerFamily('Unknown','playstation'),'playstation');
  assert.equal(controllerFamily('DualSense','generic'),'generic');
  assert.equal(controllerFamily('Unknown','bad-value'),'generic');
  assert.equal(validPromptStyle('auto'),true);
  assert.equal(validPromptStyle(null),false);
});

test('prompts follow standard gamepad face positions for interaction and memories',()=>{
  assert.equal(controllerButtonName('primary','playstation'),'Cross');
  assert.equal(controllerButtonName('back','playstation'),'Circle');
  assert.equal(controllerButtonName('journal','playstation'),'Square');
  assert.equal(controllerButtonName('journal','xbox'),'X');
  assert.equal(controllerButtonName('primary','generic'),'Bottom face button');
  assert.equal(controllerButtonName('journal','generic'),'Left face button');
});


test('shutter follows the right bumper across detected and overridden families',()=>{
  for (const [id, override, expected, mark] of [
    ['DualSense','auto','R1','R1'], ['Xbox Wireless Controller','auto','RB','RB'],
    ['Unknown','auto','Right bumper','RB'], ['Xbox','playstation','R1','R1'],
    ['DualSense','xbox','RB','RB'], ['DualSense','generic','Right bumper','RB'],
  ]) {
    const family=controllerFamily(id,override);
    assert.equal(controllerButtonName('shutter',family),expected);
    const glyph=controllerGlyph('shutter',family);
    assert.match(glyph,/<svg[^>]*aria-hidden="true"/);
    assert.ok(glyph.includes(`>${mark}</text>`));
    assert.notEqual(glyph,controllerGlyph('primary',family));
    assert.notEqual(glyph,controllerGlyph('forward',family),'bumper differs from trigger');
  }
});
