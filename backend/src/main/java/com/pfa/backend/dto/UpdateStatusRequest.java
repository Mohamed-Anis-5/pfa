package com.pfa.backend.dto;

import com.pfa.backend.enums.ComplaintStatus;
import lombok.Data;

@Data
public class UpdateStatusRequest {
    private ComplaintStatus newStatus;
    private String note;
}