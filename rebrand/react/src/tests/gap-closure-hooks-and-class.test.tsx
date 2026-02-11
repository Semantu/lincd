import {describe, expect, test} from '@jest/globals';
import React from 'react';
import {render} from '@testing-library/react';
import {useStyles} from '../utils/Hooks.js';
import {LinkedComponentClass} from '../utils/LinkedComponentClass.js';
import {linkedShape} from '../package.js';
import {Shape} from '@_linked/core/shapes/Shape';

const personClass = {id: 'urn:test:gapclass:Person'};

@linkedShape
class Person extends Shape {
  static targetClass = personClass;
}

class TestLinkedClass extends LinkedComponentClass<Person> {
  static shape = Person;

  render() {
    return <div>ok</div>;
  }
}

class BrokenLinkedClass extends LinkedComponentClass<Person> {
  render() {
    return <div>broken</div>;
  }
}

describe('gap closure: Hooks/useStyles', () => {
  test('merges class names, filters falsy values, and merges styles', () => {
    const result = useStyles(
      {
        className: ['base', '', null, 'active'],
        style: {color: 'red'},
        other: 'value',
      },
      ['extra', false as any, 'focus'],
      {fontWeight: 'bold'},
    );

    expect(result.className).toBe('base active extra focus');
    expect(result.style).toEqual({color: 'red', fontWeight: 'bold'});
    expect(result.other).toBe('value');
    expect((result as any).className.includes('  ')).toBe(false);
  });

  test('supports string class parameter and object style parameter', () => {
    const withClass = useStyles({className: 'root'}, 'extra-class');
    expect(withClass.className).toBe('root extra-class');

    const withStyles = useStyles({style: {color: 'blue'}}, {marginTop: 4});
    expect(withStyles.style).toEqual({color: 'blue', marginTop: 4});
  });
});

describe('gap closure: LinkedComponentClass', () => {
  test('sourceShape resolves from static shape and resets when source changes', () => {
    const ref = React.createRef<TestLinkedClass>();

    const firstSource = new Person({id: 'urn:test:gapclass:p1'});
    const secondSource = new Person({id: 'urn:test:gapclass:p2'});

    const {rerender} = render(
      <TestLinkedClass source={firstSource} _refresh={() => {}} ref={ref} />,
    );

    const firstShape = ref.current.sourceShape;
    expect(firstShape.id).toBe('urn:test:gapclass:p1');

    rerender(
      <TestLinkedClass source={secondSource} _refresh={() => {}} ref={ref} />,
    );

    const secondShape = ref.current.sourceShape;
    expect(secondShape.id).toBe('urn:test:gapclass:p2');
    expect(secondShape).not.toBe(firstShape);
  });

  test('sourceShape throws when class is not linked to a shape', () => {
    const ref = React.createRef<BrokenLinkedClass>();

    render(
      <BrokenLinkedClass
        source={new Person({id: 'urn:test:gapclass:p1'}) as any}
        _refresh={() => {}}
        ref={ref}
      />,
    );

    expect(() => ref.current.sourceShape).toThrow(
      'BrokenLinkedClass is not linked to a shape',
    );
  });

  test('sourceShape returns null when no source is provided', () => {
    const ref = React.createRef<TestLinkedClass>();

    render(<TestLinkedClass source={null as any} _refresh={() => {}} ref={ref} />);

    expect(ref.current.sourceShape).toBeNull();
  });
});
