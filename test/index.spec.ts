/**
 * @file
 * Spec for entry point
 */

import * as chai from 'chai';
import * as sinon from 'sinon';
import * as index from '../src/index';

const should = chai.should();

describe('main entry point', () => {
  it('exports both default and Deployer', () => {
    should.exist(index.default);
    should.exist(index.Deployer);
  });
})
