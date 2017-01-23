/** @flow */
import { Ref, BitObject } from '../objects';
import Scope from '../scope';
import Source from './source';
import ConsumerComponent from '../../consumer/component';
import Component from './component';
import { Remotes } from '../../remotes';
import { BitIds, BitId } from '../../bit-id';
import ComponentVersion from '../component-version';
import type { ParsedDocs } from '../../jsdoc/parser';
import { DEFAULT_BUNDLE_FILENAME } from '../../constants';

export type VersionProps = {
  impl: {
    name: string,
    file: Ref
  };
  specs?: ?{
    name: string,
    file: Ref
  };
  dist?: ?{
    name: string,
    file: Ref
  };
  compiler?: ?Ref;
  tester?: ?Ref;
  log: {
    message: string,
    date: string
  };
  docs?: ParsedDocs[],
  dependencies?: BitIds;
  flattenedDependencies?: BitIds;
  packageDependencies?: {[string]: string}; 
  buildStatus?: boolean;
  testStatus?: boolean;
}

export default class Version extends BitObject {
  impl: {
    name: string,
    file: Ref
  };
  specs: ?{
    name: string,
    file: Ref
  };
  dist: ?{
    name: string,
    file: Ref
  };
  compiler: ?Ref;
  tester: ?Ref;
  log: {
    message: string,
    date: string
  };
  docs: ?ParsedDocs[];
  dependencies: BitIds;
  flattenedDependencies: BitIds;
  packageDependencies: {[string]: string};
  buildStatus: ?boolean;
  testStatus: ?boolean;

  constructor(props: VersionProps) {
    super();
    this.impl = props.impl;
    this.specs = props.specs;
    this.dist = props.dist;
    this.compiler = props.compiler;
    this.tester = props.tester;
    this.log = props.log;
    this.dependencies = props.dependencies || new BitIds();
    this.docs = props.docs;
    this.flattenedDependencies = props.flattenedDependencies || new BitIds();
    this.packageDependencies = props.packageDependencies || {};
    this.buildStatus = props.buildStatus;
    this.testStatus = props.testStatus;
  }

  flattenDependencies(scope: Scope, remotes: Remotes) {
    this.dependencies.fetch(scope, remotes);
  }

  id() {
    return JSON.stringify(this.toObject());
  }

  collectDependencies(scope: Scope): Promise<ComponentVersion[]> {
    return scope.manyOnes(this.flattenedDependencies);
  }

  refs(): Ref[] {
    return [
      this.impl.file,
      // $FlowFixMe
      this.specs ? this.specs.file : null,
      // $FlowFixMe (after filtering the nulls there is no problem)
      this.dist ? this.dist.file : null,
    ].filter(ref => ref);
  }

  toObject() {
    return {
      impl: {
        file: this.impl.file.toString(),
        name: this.impl.name
      },
      specs: this.specs ? {
        file: this.specs.file.toString(),
        // $FlowFixMe
        name: this.specs.name        
      }: null,
      dist: this.dist ? {
        file: this.dist.file.toString(),
        // $FlowFixMe
        name: this.dist.name        
      }: null,
      compiler: this.compiler ? this.compiler.toString(): null,
      tester: this.tester ? this.tester.toString(): null,
      log: {
        message: this.log.message,
        date: this.log.date,
      },
      docs: this.docs,
      dependencies: this.dependencies.map(dep => dep.toString()),
      flattenedDependencies: this.flattenedDependencies.map(dep => dep.toString()),
      packageDependencies: this.packageDependencies,
      buildStatus: this.buildStatus,
      testStatus: this.testStatus
    };
  }

  toBuffer(): Buffer {
    const obj = this.toObject();
    return Buffer.from(JSON.stringify(obj));
  }

  static parse(contents) {
    const props = JSON.parse(contents);
    return new Version({
      impl: {
        file: Ref.from(props.impl.file),
        name: props.impl.name
      },
      specs: props.specs ? {
        file: Ref.from(props.specs.file),
        name: props.specs.name        
      } : null,
      dist: props.dist ? {
        file: Ref.from(props.dist.file),
        name: props.dist.name        
      } : null,
      compiler: props.compiler ? Ref.from(props.compiler): null,
      tester: props.tester ? Ref.from(props.tester): null,
      log: {
        message: props.log.message,
        date: props.log.date,
      },
      docs: props.docs,
      dependencies: BitIds.deserialize(props.dependencies),
      flattenedDependencies: BitIds.deserialize(props.flattenedDependencies),
      packageDependencies: props.packageDependencies,
      buildStatus: props.buildStatus,
      testStatus: props.testStatus
    });
  }

  static fromComponent({ component, impl, specs, dist, flattenedDeps, message }: {
    component: ConsumerComponent,
    impl: Source,
    specs: Source,
    flattenedDeps: BitId[],
    message: string,
    dist: Source
  }) {
    return new Version({
      impl: {
        file: impl.hash(),
        name: component.implFile
      },
      specs: specs ? {
        file: specs.hash(),
        name: component.specsFile
      }: null,
      dist: dist ? {
        file: dist.hash(),
        name: DEFAULT_BUNDLE_FILENAME,
      }: null,
      compiler: component.compilerId ? Component.fromBitId(component.compilerId).hash() : null,
      tester: component.testerId ? Component.fromBitId(component.testerId).hash() : null,
      log: {
        message,
        date: Date.now().toString(),
      },
      docs: component.docs,
      packageDependencies: component.packageDependencies,
      flattenedDependencies: flattenedDeps,
      dependencies: component.dependencies
    });    
  }
}
