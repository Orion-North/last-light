import test from 'node:test';
import assert from 'node:assert/strict';
import { createSurvey, surveyProfiles } from '../../src/engine/fieldwork.js';
import { recordedChoice, scenes } from '../../src/content/story.js';

test('every authored survey requires each view and completes once', () => {
  for (const profile of Object.values(surveyProfiles)) {
    const origin = { yaw: 3.1, pitch: 1.2 };
    const survey = createSurvey(profile, origin);
    let result;
    for (let i = 0; i < profile.steps.length; i++) {
      const target = profile.steps[i];
      for (let frame = 0; frame < Math.round((target.hold ?? .6)*10); frame++) result = survey.sample({ yaw: origin.yaw + target.yaw, pitch: origin.pitch + target.pitch }, .1);
      assert.equal(result.step, i + 1);
    }
    assert.equal(result.complete, true);
    assert.equal(result.progress, 1);
    assert.equal(survey.sample({yaw: NaN, pitch: NaN}, 20).complete, true);
  }
});

test('leaving a view resets its hold; frame stalls and motion cannot finish it', () => {
  const profile = {steps: [{yaw: 0, pitch: 0, hint: 'Look'}]};
  const survey = createSurvey(profile);
  survey.sample({yaw: 0, pitch: 0}, .5);
  assert.equal(survey.sample({yaw: 0, pitch: 0, steady: false}, .1).progress, 0);
  assert.equal(survey.sample({yaw: 0, pitch: 0}, 20).complete, false);
  assert.equal(survey.sample({yaw: 1, pitch: 0}, .1).progress, 0);
});

test('recorded choices preserve real IDs and only two curation menus', () => {
  for (const scene of scenes) {
    const choice = recordedChoice(scene, {memories: []});
    if (['first-morning', 'months', 'what-remains'].includes(scene.id)) assert.equal(choice, null);
    else assert.ok(scene.choices.includes(choice));
  }
  const recall = scenes.find(scene => scene.id === 'smaller-world');
  assert.equal(recordedChoice(recall, {memories: [{sceneId:'stone-ripples',choiceId:'layers'}]}).id, 'discovery');
  assert.equal(recordedChoice(recall, {memories: [{sceneId:'stone-ripples',choiceId:'landscape'}]}).id, 'together');
});

test('overlapping views cannot be recorded by leaving the camera still',()=>{
  const survey=createSurvey({steps:[{yaw:0,pitch:0,hint:'first'},{yaw:.2,pitch:0,hint:'second'}]});
  let result;
  for(let i=0;i<30;i++)result=survey.sample({yaw:.1,pitch:0},.1);
  assert.equal(result.step,1);assert.equal(result.complete,false);
  for(let i=0;i<6;i++)result=survey.sample({yaw:.24,pitch:0},.1);
  assert.equal(result.complete,true);
});
