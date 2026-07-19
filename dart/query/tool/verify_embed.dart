import 'dart:convert';
import 'dart:io';

/// Fails if the embedded corpus does not match the workspace contract.
///
///     dart run tool/verify_embed.dart
///
/// CI uses this so a forgotten `embed_goldens` cannot ship a stale dart2js payload — i.e. so the
/// web run and the VM run cannot silently be testing two different contracts.
const corpusPath = '../../contract/corpora/emission/corpus.json';

void main() {
  final contract = File(corpusPath);
  final embed = File('test/conformance/corpus_data.dart');

  if (!contract.existsSync()) {
    stderr.writeln('Contract corpus not found at $corpusPath.');
    exit(1);
  }
  if (!embed.existsSync()) {
    stderr.writeln('test/conformance/corpus_data.dart is missing.');
    exit(1);
  }

  final expected = contract.readAsBytesSync();
  final source = embed.readAsStringSync();
  final match = RegExp(r"const _corpusBase64 =\s*((?:'[^']*'\s*)+);");
  final m = match.firstMatch(source);
  if (m == null) {
    stderr.writeln('Could not find _corpusBase64 in corpus_data.dart.');
    exit(1);
  }

  final b64 = m.group(1)!.replaceAll("'", '').replaceAll(RegExp(r'\s'), '');
  final decoded = base64.decode(b64);

  if (!_bytesEqual(expected, decoded)) {
    stderr.writeln(
      'Embedded corpus_data.dart does NOT match $corpusPath.\n'
      'Run: dart run tool/embed_goldens.dart',
    );
    exit(1);
  }

  stdout.writeln('Embed matches the contract corpus '
      '(${expected.length} bytes, fingerprint ${_fingerprint(expected)}).');
}

bool _bytesEqual(List<int> a, List<int> b) {
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; i++) {
    if (a[i] != b[i]) return false;
  }
  return true;
}

String _fingerprint(List<int> bytes) {
  // Avoid adding a crypto dependency — a short stable digest for the log line only.
  // Full byte equality is checked above; this is not a security boundary.
  var h = 0;
  for (final b in bytes) {
    h = 0x1fffffff & (h + b);
    h = 0x1fffffff & (h + ((0x0007ffff & h) << 10));
    h ^= h >> 6;
  }
  h = 0x1fffffff & (h + ((0x03ffffff & h) << 3));
  h ^= h >> 11;
  h = 0x1fffffff & (h + ((0x00003fff & h) << 15));
  return h.toRadixString(16).padLeft(8, '0');
}
