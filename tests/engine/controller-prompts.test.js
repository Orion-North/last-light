import test from 'node:test';
import assert from 'node:assert/strict';
import { controllerFamily, controllerButtonName, validPromptStyle } from '../../src/ui/controller-prompts.js';

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

test('prompts follow standard gamepad face positions without swapping journal and camera',()=>{
  assert.equal(controllerButtonName('primary','playstation'),'Cross');
  assert.equal(controllerButtonName('back','playstation'),'Circle');
  assert.equal(controllerButtonName('journal','playstation'),'Square');
  assert.equal(controllerButtonName('camera','playstation'),'Triangle');
  assert.equal(controllerButtonName('journal','xbox'),'X');
  assert.equal(controllerButtonName('camera','xbox'),'Y');
  assert.equal(controllerButtonName('primary','generic'),'Bottom face button');
  assert.equal(controllerButtonName('journal','generic'),'Left face button');
});
