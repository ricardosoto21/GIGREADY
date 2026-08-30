# FFmpeg / FFprobe Distribution Notes

This document records the FFmpeg and FFprobe binaries included with GigReady for Windows x64 distribution.

## Included Binaries

- File: `vendor/ffmpeg/win-x64/ffmpeg.exe`
- File: `vendor/ffmpeg/win-x64/ffprobe.exe`
- Packaged location: `resources/ffmpeg/ffmpeg.exe`
- Packaged location: `resources/ffmpeg/ffprobe.exe`
- Source archive: `ffmpeg-master-latest-win64-lgpl.zip`
- Source project: https://github.com/BtbN/FFmpeg-Builds
- Downloaded and verified: 2026-06-26
- FFmpeg legal reference: https://ffmpeg.org/legal.html

## Version

```text
ffmpeg version N-125307-gd66e84695b-20260626 Copyright (c) 2000-2026 the FFmpeg developers
ffprobe version N-125307-gd66e84695b-20260626 Copyright (c) 2007-2026 the FFmpeg developers
```

## Hashes

```text
SHA256 3BA2FBF1D5A7E38BEEE91B49D8867AA15474DD19E8575226ADADE491BFD5B0AD  ffmpeg-master-latest-win64-lgpl.zip
SHA256 795D40ACB1EA31234C18186B17E5420BAB35090BCB058604A67B0CA7DF5DBD24  vendor/ffmpeg/win-x64/ffmpeg.exe
SHA256 71BF7EBDB6CEFE35A31DE685A9BB3ADFDE8B55FE49A41275E15093A6A5CCFF43  vendor/ffmpeg/win-x64/ffprobe.exe
```

The archive hash matched the upstream `checksums.sha256` entry for `ffmpeg-master-latest-win64-lgpl.zip`.

## License Verification

Commands:

```powershell
vendor\ffmpeg\win-x64\ffmpeg.exe -L
vendor\ffmpeg\win-x64\ffprobe.exe -L
```

Validated output includes:

```text
GNU Lesser General Public License
```

The build configuration was checked for distribution blockers:

```text
--enable-gpl: not present
--enable-nonfree: not present
```

## Distribution Obligations

Before any commercial or public release:

1. Keep the LGPL license text in the installer resources.
2. Keep `THIRD_PARTY_NOTICES.md` available to users.
3. Keep this document updated when either binary changes.
4. Regenerate checksums after each binary or installer change.
5. Do not replace these binaries with a build that includes `--enable-gpl` or `--enable-nonfree`.
6. Ensure GigReady's EULA does not restrict LGPL rights for FFmpeg/FFprobe.

## Verification Command

Run:

```bash
npm run verify:ffmpeg
```

Expected result:

```text
FFmpeg LGPL verification passed.
FFprobe LGPL verification passed.
```
