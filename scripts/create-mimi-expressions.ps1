# 用原创几何图形绘制米米表情占位图，不读取或修改已有图片。
Add-Type -AssemblyName System.Drawing
$mimiAssetDirectory = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../miniprogram/assets/characters/mimi'))
if (-not (Test-Path -LiteralPath $mimiAssetDirectory -PathType Container)) {
    throw '米米资源目录不存在'
}

foreach ($expression in @('happy', 'thinking', 'surprise')) {
    $bitmap = [Drawing.Bitmap]::new(512, 512, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $drawing = [Drawing.Graphics]::FromImage($bitmap)
    $drawing.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $drawing.Clear([Drawing.Color]::Transparent)
    $fur = [Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml('#D79550'))
    $cream = [Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml('#F7E6BE'))
    $pink = [Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml('#EDB294'))
    $white = [Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml('#FFFDF2'))
    $brown = [Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml('#835234'))
    $nose = [Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml('#B86F68'))
    $outline = [Drawing.Pen]::new([Drawing.ColorTranslator]::FromHtml('#835234'), 5)
    $stripe = [Drawing.Pen]::new([Drawing.ColorTranslator]::FromHtml('#AA6B35'), 8)
    try {
        # 固定头部、耳朵、条纹和口鼻位置，表情变化不改变角色比例。
        $leftEar = [Drawing.Point[]]@([Drawing.Point]::new(96,216), [Drawing.Point]::new(128,80), [Drawing.Point]::new(210,154))
        $rightEar = [Drawing.Point[]]@([Drawing.Point]::new(302,154), [Drawing.Point]::new(386,80), [Drawing.Point]::new(416,216))
        $drawing.FillPolygon($fur, $leftEar)
        $drawing.FillPolygon($fur, $rightEar)
        $drawing.DrawPolygon($outline, $leftEar)
        $drawing.DrawPolygon($outline, $rightEar)
        $drawing.FillPolygon($pink, [Drawing.Point[]]@([Drawing.Point]::new(134,147), [Drawing.Point]::new(146,104), [Drawing.Point]::new(179,155)))
        $drawing.FillPolygon($pink, [Drawing.Point[]]@([Drawing.Point]::new(332,155), [Drawing.Point]::new(367,104), [Drawing.Point]::new(378,147)))
        $drawing.FillEllipse($fur, 80,136,352,296)
        $drawing.DrawEllipse($outline, 80,136,352,296)
        $drawing.FillEllipse($cream, 156,282,200,126)
        $drawing.DrawLine($stripe, 199,185,188,212)
        $drawing.DrawLine($stripe, 256,174,256,208)
        $drawing.DrawLine($stripe, 315,185,325,212)
        $drawing.FillPolygon($nose, [Drawing.Point[]]@([Drawing.Point]::new(238,306), [Drawing.Point]::new(274,306), [Drawing.Point]::new(256,325)))
        $drawing.DrawLine($outline, 144,317,201,327)
        $drawing.DrawLine($outline, 311,327,369,317)
        if ($expression -eq 'happy') {
            # 弯起眼睛与微笑，表达共同发现后的开心。
            $drawing.DrawArc($outline, 172,238,38,28,190,160)
            $drawing.DrawArc($outline, 304,238,38,28,190,160)
            $drawing.DrawArc($outline, 234,327,44,30,0,180)
        } elseif ($expression -eq 'thinking') {
            # 轻抬眉与侧视，不使用责备或恐惧表情。
            $drawing.FillEllipse($white, 171,235,38,42)
            $drawing.FillEllipse($white, 303,235,38,42)
            $drawing.FillEllipse($brown, 189,244,16,26)
            $drawing.FillEllipse($brown, 321,244,16,26)
            $drawing.DrawLine($outline, 174,224,204,215)
            $drawing.DrawArc($outline, 241,335,30,14,10,140)
        } else {
            # 圆眼与小圆嘴，表达找到线索的惊喜。
            $drawing.FillEllipse($white, 168,230,44,50)
            $drawing.FillEllipse($white, 300,230,44,50)
            $drawing.FillEllipse($brown, 182,240,17,30)
            $drawing.FillEllipse($brown, 314,240,17,30)
            $drawing.DrawEllipse($outline, 246,334,20,28)
        }
        $outputFile = Join-Path $mimiAssetDirectory ('char_mimi_' + $expression + '_front_v01.png')
        $bitmap.Save($outputFile, [Drawing.Imaging.ImageFormat]::Png)
    } finally {
        foreach ($resource in @($drawing, $bitmap, $fur, $cream, $pink, $white, $brown, $nose, $outline, $stripe)) { $resource.Dispose() }
    }
}
