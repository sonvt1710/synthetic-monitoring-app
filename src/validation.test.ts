import {
  validateDomain,
  validateHostAddress,
  validateHostPort,
  validateHttpTarget,
  validateLabelName,
  validateLabelValue,
} from 'validation';

jest.unmock('utils');

describe('http', () => {
  it('should reject non-http URLs', async () => {
    const testcases: string[] = ['ftp://example.org/', 'schema://example.org/'];
    testcases.forEach((testcase: string) => {
      expect(validateHttpTarget(testcase)).toEqual('Target must be a valid web URL');
    });
  });

  it('should reject an http target without TLD', async () => {
    expect(validateHttpTarget('https://hostname/')).toEqual('Target must have a valid hostname');
    expect(validateHttpTarget('https://suraj/dev')).toEqual('Target must have a valid hostname');
  });

  it('should reject URLs without schema', () => {
    const testcases: string[] = ['example.org'];
    testcases.forEach((testcase: string) => {
      expect(validateHttpTarget(testcase)).toEqual('Target must be a valid web URL');
    });
  });

  it('should reject malformed ipv6 https targets', async () => {
    const url = 'https://[2001:0db8:1001:1001:1001:1001:1001:1001/';
    expect(validateHttpTarget(url)).toBe('Target must be a valid web URL');
  });

  it('should accept http schema as HTTP target', async () => {
    const testcases: string[] = ['http://grafana.com/'];
    testcases.forEach((testcase: string) => {
      expect(validateHttpTarget(testcase)).toBe(undefined);
    });
  });

  it('should accept hostnames with leading numbers', async () => {
    expect(validateHttpTarget('http://500grafana.com')).toBe(undefined);
    expect(validateHttpTarget('http://www.500grafana.com')).toBe(undefined);
  });

  it('should accept https schema as HTTP target', async () => {
    const testcases: string[] = ['https://grafana.com/'];
    testcases.forEach((testcase: string) => {
      expect(validateHttpTarget(testcase)).toBe(undefined);
    });
  });

  it('should accept urls with curly brackets in param values', async () => {
    expect(validateHttpTarget('https://example.com?data={name%3Asteve}')).toBe(undefined);
  });

  it('should accept http targets with ipv6 domains', async () => {
    [
      'https://[2001:0db8:1001:1001:1001:1001:1001:1001]/',
      'https://[2001:0db8:1001:1001:1001:1001:1001:1001]:8080/',
      'http://[2001:0db8:1001:1001:1001:1001:1001:1001]/',
      'http://[2001:0db8:1001:1001:1001:1001:1001:1001]:8080/',
    ].forEach((url) => expect(validateHttpTarget(url)).toBe(undefined));
  });

  it('should accept URL with IPv4 addresses as HTTP target', async () => {
    const testcases: string[] = [
      'http://1.2.3.4/',
      'http://1.2.3.4:8080/',
      'https://1.2.3.4/',
      'https://1.2.3.4:8080/',
    ];
    testcases.forEach((testcase: string) => {
      expect(validateHttpTarget(testcase)).toBe(undefined);
    });
  });
});

describe('PING', () => {
  it('should reject hostnames without domains', async () => {
    expect(validateHostAddress('grafana')).toBe('Target must be a valid host address');
  });
  it('should reject ping targets with invalid hostnames', async () => {
    const testcases: string[] = ['x.', '.y', 'x=y.org'];
    testcases.forEach((testcase: string) => {
      expect(validateHostAddress(testcase)).toBe('Target must be a valid host address');
    });
  });

  it('should accept IPv4 as ping target', async () => {
    const testcases: string[] = [
      '1.2.3.4',
      '127.0.0.1',
      '10.0.0.0',
      '169.254.0.0',
      '192.168.0.0',
      '172.16.0.0',
      '224.0.0.0',
    ];
    testcases.forEach((testcase: string) => {
      expect(validateHostAddress(testcase)).toBe(undefined);
    });
  });

  it('should accept IPv6 as ping target', async () => {
    const testcases: string[] = [
      '2600:1901:0:bae2::1',
      '::1',
      '::ffff:1.2.3.4',
      '2001:0db8:1001:1001:1001:1001:1001:1001',
      'fc00::', // unique local address
      'fe80::', // link-local address
      'ff00::', // multicast address
    ];
    testcases.forEach((testcase: string) => {
      expect(validateHostAddress(testcase)).toBe(undefined);
    });
  });
});

describe('DNS', () => {
  it('should reject single element domains', async () => {
    expect(validateDomain('grafana')).toBe('Invalid number of elements in hostname');
  });

  it('should reject dns targets with invalid element length', async () => {
    expect(validateDomain('.y')).toBe(
      'Invalid domain element length. Each element must be between 1 and 62 characters'
    );
  });

  it('should reject dns targets with invalid characters', async () => {
    expect(validateDomain('x=y.org')).toBe(
      'Invalid character in domain name. Only letters, numbers, underscores and "-" are allowed'
    );
  });

  it('should reject ip address', async () => {
    expect(validateDomain('127.0.0.1')).toBe('IP addresses are not valid DNS targets');
  });

  it('IP address disguised as multi-label fully qualified  dns name is invalid', async () => {
    expect(validateDomain('127.0.0.1.')).toBe('A domain TLD cannot contain only numbers');
  });

  it('should accept dns targets with trailing .', async () => {
    expect(validateDomain('grafana.')).toBe(undefined);
  });

  it('should accept valid hostnames', () => {
    expect(validateDomain('grafana.com')).toBe(undefined);
  });

  it(`should accept valid hostnames that start with an underscore`, () => {
    expect(validateDomain('hello._grafana.com')).toBe(undefined);
  });

  it(`should reject hostnames that end or start with a hyphen`, () => {
    expect(validateDomain('-hello.com')).toBe('A domain element must begin with a letter, number or underscore');
    expect(validateDomain('hello-.com')).toBe('A domain element must end with a letter, number or underscore');
  });

  it(`should accept hostnames that contain hyphens`, () => {
    expect(validateDomain('hello-world.com')).toBe(undefined);
  });

  it(`should accept hostnames that contain underscores`, () => {
    expect(validateDomain('hello_world.com')).toBe(undefined);
  });
});

describe('tcp', () => {
  it('should reject tcp targets without valid ports', async () => {
    expect(validateHostPort('x:y')).toBe('Must be a valid host:port combination');
    expect(validateHostPort('x:y:')).toBe('Must be a valid host:port combination');
    expect(validateHostPort('x:y:0')).toBe('Must be a valid host:port combination');
    expect(validateHostPort('x:y:65536')).toBe('Must be a valid host:port combination');
    expect(validateHostPort('grafana.com:65536')).toBe('Port must be less than 65535');
    expect(validateHostPort('grafana.com:0')).toBe('Port must be greater than 0');
  });

  it('should accept tcp targets with host:port', async () => {
    const testcases: string[] = ['x.y:25', '1.2.3.4:25', '[2001:0db8:1001:1001:1001:1001:1001:1001]:8080'];
    testcases.forEach((testcase: string) => {
      expect(validateHostPort(testcase)).toBe(undefined);
    });
  });
});

describe('labels', () => {
  it('rejects duplicate label names', async () => {
    const error = validateLabelName('a_name', [
      { name: 'a_name', value: 'a_value' },
      { name: 'a_name', value: 'a_different_value' },
    ]);
    expect(error).toBe('Label names cannot be duplicated');
  });

  it('rejects label names that are too long', async () => {
    const longLabelName =
      'LoremipsumdolorsitametconsecteturadipiscingelitSedhendreritnonnibhetaliquetPraesentquisjustoacnibhtempusidstoacnibhtempusidstoacnibhtempusidstoacnibhtempusid';
    const error = validateLabelName(longLabelName, []);
    const shortEnough = validateLabelName(longLabelName.slice(0, 127), []);
    expect(error).toBe('Label names must be 128 characters or less');
    expect(shortEnough).toBe(undefined);
  });

  it('rejects label values that are too long', async () => {
    const longLabelValue =
      'LoremipsumdolorsitametconsecteturadipiscingelitSedhendreritnonnibhetaliquetPraesentquisjustoacnibhtempusidstoacnibhtempusidstoacnibhtempusidstoacnibhtempusid';
    const error = validateLabelValue(longLabelValue);
    const shortEnough = validateLabelValue(longLabelValue.slice(0, 127));
    expect(error).toBe('Label values must be 128 characters or less');
    expect(shortEnough).toBe(undefined);
  });
});
